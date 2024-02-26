"""
Hooks to the DiagnoseAI Core's Web PubSub service. Once a message is
received, forwards the message to an OpenAI model, and publishes the
response.

References:
- https://techcommunity.microsoft.com/t5/apps-on-azure-blog/tutorial-azure-web-pubsub-trigger-for-azure-python-functions/ba-p/3650727 (setting up instructions)
- https://learn.microsoft.com/en-us/azure/azure-web-pubsub/reference-functions-bindings?tabs=csharp#usages (the function.json)
"""  # pylint: disable=line-too-long # noqa: E501

import logging
import os
from datetime import datetime
from json import JSONDecodeError
from typing import cast

from azure.messaging.webpubsubservice import WebPubSubServiceClient  # type: ignore[import-untyped] # noqa: E501 # pylint: disable=line-too-long
from openai.types.chat import ChatCompletionMessageParam
from openai import AzureOpenAI

from models.chat_message import ChatMessageDAO, ChatMessageModel
from utils.chat_message import (BidirectionalChatMessage, ChatMessage,
                                ResponseChatMessage, ResponseErrorMessage)
from utils.db import create_session
from utils.web_pub_sub_interfaces import WebPubSubRequest
from utils.verify_token import verify_token
from utils.get_user_id import get_user_id
from utils.authorise_conversation import authorise_user

# Load required variables from the environment

WPBSS_CONNECTION_STRING = os.environ['WebPubSubConnectionString']
WPBSS_HUB_NAME = os.environ['WebPubSubHubName']

SEARCH_KEY = os.environ["CognitiveSearchKey"]
SEARCH_ENDPOINT = os.environ["CognitiveSearchEndpoint"]

OPENAI_KEY = os.environ["OpenAIKey"]
OPENAI_ENDPOINT = os.environ["OpenAIEndpoint"]

DATABASE_URL = os.environ['DatabaseURL']
DATABASE_NAME = os.environ['DatabaseName']
DATABASE_USERNAME = os.environ['DatabaseUsername']
DATABASE_PASSWORD = os.environ['DatabasePassword']
DATABASE_SELFSIGNED = os.environ.get('DatabaseSelfSigned')

# Global clients

logging.basicConfig(level=logging.INFO)

ai_client = AzureOpenAI(
    base_url=(f"{OPENAI_ENDPOINT}/openai/deployments/"
              "validation-testing-model/extensions"),
    api_key=OPENAI_KEY,
    api_version='2023-09-01-preview'
)

db_session = create_session(
    DATABASE_URL, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD,
    bool(DATABASE_SELFSIGNED)
)


def ws_send_message(text: str, connection_id: str) -> None:
    """
    Sends a message over WebSockets.
    """
    # WebPubSubServiceClient DOES have from_connection_string, dunno
    # why PyLint refuses to acknowledge it.
    service: WebPubSubServiceClient = WebPubSubServiceClient \
        .from_connection_string(  # pylint: disable=no-member
            WPBSS_CONNECTION_STRING,
            hub=WPBSS_HUB_NAME
        )
    service.send_to_connection(connection_id,
                               text,
                               content_type='application/json')


def shadow_msg_to_db(
        conversation_id: str, message: str, sender_is_bot: bool) -> None:
    """
    Shadows the message to the database
    """
    ChatMessageDAO.save_message(
        db_session,
        ChatMessageModel.from_bidirectional_chat_message(
            BidirectionalChatMessage(  # pylint: disable=unexpected-keyword-arg, no-value-for-parameter # noqa: E501
                message=message,
                conversation_id=conversation_id,
                sent_at=datetime.now(),
                sender='bot' if sender_is_bot else 'user'
            )
        )
    )


def db_history_to_ai_history(conversation_id: str, history_size: int = 10) \
        -> list[ChatCompletionMessageParam]:
    """
    Gets the history from the database and converts openai format
    """
    history = ChatMessageDAO.get_all_messages_for_conversation(
        db_session, conversation_id, count=history_size)

    # Should either match ChatCompletionSystemMessageParam or
    # ChatCompletionUserMessageParam, so we cast to make typing happy
    return [
        cast(ChatCompletionMessageParam,
             {'role': 'system' if msg.sender.name == 'bot' else 'user',
              'content': msg.message}) for msg in history]


def ws_log_and_send_error(text: str, connection_id: str) -> None:
    """
    Logs an error and sends an error message through the websocket
    """
    logging.error('Cannot parse ChatMessage: %s', text)
    ws_send_message(ResponseErrorMessage(text).to_json(), connection_id)


def process_message(message: ChatMessage, connection_id: str) -> None:
    """
    Processes the message received from the request.

    For now, the message goes directly into Azure OpenAI, which spits
    out a chat message.

    Args:
        message (ChatMessage): The ChatMessage object deserialize from the
                               input
        connection_id (str): The conneciton ID of the websocket in question
    """

    if not verify_token(message.auth_token):
        ws_log_and_send_error(
            ('Invalid token.'
             f' for debugging purposes, you were {connection_id}'),
            connection_id)
        return

    curr_user = get_user_id(message.auth_token)
    if not authorise_user(db_session, message.conversation_id, curr_user):
        ws_log_and_send_error(
            ('User not authorised.'
             f' for debugging purposes, you were {connection_id}'),
            connection_id)
        return

    logging.info('%s: sending to model', connection_id)
    messages = db_history_to_ai_history(message.conversation_id)
    messages.append({'role': 'user', 'content': message.message})
    shadow_msg_to_db(message.conversation_id, message.message, False)
    # TODO: Probably want to refactor calling the model to a function
    # to reduce the size of this monster
    chat_response = ai_client.chat.completions.create(
        model='validation-testing-model',
        extra_body={
            "dataSources": [
                {
                    "type": "AzureCognitiveSearch",
                    "parameters": {
                        "endpoint": SEARCH_ENDPOINT,
                        "key": SEARCH_KEY,
                        "indexName": message.index,
                    }
                }
            ],
        },
        messages=messages,
    )

    logging.info('%s: model response received', connection_id)
    if len(chat_response.choices) == 0 \
       or chat_response.choices[0].message.content is None:
        ws_log_and_send_error(
            ('no response from AI chat.'
             f' for debugging purposes, you were {connection_id}'),
            connection_id)
        return

    response = ResponseChatMessage(
        chat_response.choices[0].message.content,
        message.conversation_id,
        datetime.now()
    )
    shadow_msg_to_db(message.conversation_id, response.body, True)
    ws_send_message(response.to_json(), connection_id)


def main(request: str) -> None:
    """
    Entrypoint of the chat function.

    Args:
        request (str): The raw data string. It should be a
                       serializable to WebPubSubRequest. The data
                       parameter should then be serializable to
                       ChatMessage
    """
    serialized_request = None
    try:
        serialized_request = WebPubSubRequest.from_json(request)
        process_message(
            ChatMessage.from_json(serialized_request.data),
            serialized_request.connection_context.connection_id
        )
    except (KeyError, JSONDecodeError) as e:
        if serialized_request is not None:
            ws_log_and_send_error(f'{str(e)}',
                                  serialized_request
                                  .connection_context.connection_id)
        else:
            logging.fatal('Cannot parse request at all. %s', e)
