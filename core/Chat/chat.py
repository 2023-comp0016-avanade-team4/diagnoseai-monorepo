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
import re
from datetime import datetime
from json import JSONDecodeError
from typing import Callable, cast

from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import ResourceNotFoundError
from azure.messaging.webpubsubservice import \
    WebPubSubServiceClient  # type: ignore[import-untyped] # noqa: E501 # pylint: disable=line-too-long
from azure.search.documents.indexes import SearchIndexClient
from openai import AzureOpenAI
from openai.types.chat import ChatCompletionMessageParam
from models.chat_message import ChatMessageDAO, ChatMessageModel
from utils.hashing import get_search_index_for_user_id
from utils.authorise_conversation import authorise_user
from utils.chat_message import (BidirectionalChatMessage, ChatMessage,
                                ResponseChatMessage, ResponseErrorMessage)
from utils.db import create_session
from utils.get_user_id import get_user_id
from utils.verify_token import verify_token
from utils.web_pub_sub_interfaces import WebPubSubRequest

# Load required variables from the environment

WPBSS_CONNECTION_STRING = os.environ['WebPubSubConnectionString']
WPBSS_HUB_NAME = os.environ['WebPubSubHubName']

SEARCH_KEY = os.environ["CognitiveSearchKey"]
SEARCH_ENDPOINT = os.environ["CognitiveSearchEndpoint"]

SUMMARY_SEARCH_KEY = os.environ["SummarySearchKey"]
SUMMARY_SEARCH_ENDPOINT = os.environ["SummarySearchEndpoint"]

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

si_client = SearchIndexClient(SEARCH_ENDPOINT,
                              AzureKeyCredential(SEARCH_KEY))


class ChatError(Exception):
    """
    Represents a chat-related error. The exception raiser should be
    the one that handles the exception (e.g. send error messages to
    the WebSocket)
    """


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
            BidirectionalChatMessage(
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


def __index_guard(index_name: str, fully_applied_fn: Callable[[], str]) -> str:
    """
    Guards a function that requires an existing search index

    Args:
        index_name (str): The index name
        fully_applied_fn (Callable[[], str]): The function to call if the
                                              index exists

    Returns:
        str: The response from the function
    """
    try:
        si_client.get_index(index_name)
        return fully_applied_fn()
    except ResourceNotFoundError:
        logging.info('Index %s does not exist, guard is skipping the callable',
                     index_name)
        return ''


def strip_all_citations(completion: str) -> str:
    """
    Strips all citations from a completion
    """
    doc_regex = r'\s*\[doc\d+\]'
    return re.sub(doc_regex, '', completion)


def __query_llm_with_index(
        messages: list[ChatCompletionMessageParam],
        document_index: str,
        search_endpoint: str,
        search_key: str,
        connection_id: str) -> str:
    """
    Queries the AI model from the validation document index.

    Args:
        messages (list[ChatCompletionMessageParam]): The messages to
            send to the model
        document_index (str): The document index to query
        search_endpoint (str): The search endpoint
        search_key (str): The search key
        connection_id (str): The connection ID

    Returns:
        str: The response from the model
    """
    chat_response = ai_client.chat.completions.create(
        model='validation-testing-model',
        extra_body={
            "dataSources": [
                {
                    "type": "AzureCognitiveSearch",
                    "parameters": {
                        "endpoint": search_endpoint,
                        "key": search_key,
                        "indexName": document_index,
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
        raise ChatError('no response from AI chat')
    return chat_response.choices[0].message.content


def combine_responses_with_llm(
        responses: list[str], connection_id: str) -> str:
    """
    Combines responses with the LLM. This function is used in tandem
    with __query_llm_with_index; for all responses received, it will
    query the LLM with the responses and return the final response.

    Args:
        responses (list[str]): The responses to combine
        connection_id (str): The connection ID

    Returns:
        str: The combined response
    """
    cleaned_responses = [response for response in responses
                         if response.strip() != '']

    if len(cleaned_responses) <= 1:
        return responses[0]

    chat_response = ai_client.chat.completions.create(
        model='validation-testing-model',
        messages=[{
            "role": "system",
            "content": ("You are a model that combines several "
                        "assistant responses. Given all "
                        "messages after this prompt, you will "
                        "generate a response that combines all "
                        "the messages. In your response, do not "
                        "contradict yourself; if you find any "
                        "contradicting information, prioritize "
                        "the most recent message. Please "
                        "preserve any tags that look like this: "
                        "[doc1].")
        }, *[cast(ChatCompletionMessageParam,
                  {"role": "user", "content": response})
             for response in cleaned_responses]]
    )

    logging.info('%s: combining model response received', connection_id)
    if len(chat_response.choices) == 0 \
       or chat_response.choices[0].message.content is None:
        ws_log_and_send_error(
            ('no response from combining.'
             f' for debugging purposes, you were {connection_id}'),
            connection_id)
        raise ChatError('no response from combining')
    return chat_response.choices[0].message.content


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
    summary_index = get_search_index_for_user_id(curr_user)

    try:
        chat_response = combine_responses_with_llm(
            [__query_llm_with_index(messages, message.index,
                                    SEARCH_ENDPOINT, SEARCH_KEY,
                                    connection_id),
             __index_guard(summary_index,
                           lambda: strip_all_citations(
                               __query_llm_with_index(
                                   messages, summary_index,
                                   SUMMARY_SEARCH_ENDPOINT, SUMMARY_SEARCH_KEY,
                                   connection_id)))
             ],
            connection_id
        )
    except ChatError:
        # chat errors already have responses sent to the websocket
        return

    logging.info('%s: model response received', connection_id)
    if chat_response.strip() == '':
        ws_log_and_send_error(
            ('empty response.'
             f' for debugging purposes, you were {connection_id}'),
            connection_id)
        return

    response = ResponseChatMessage(
        chat_response,
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
        chat_message = ChatMessage.from_json(serialized_request.data)
        process_message(
            chat_message,
            serialized_request.connection_context.connection_id
        )
    except (KeyError, JSONDecodeError) as e:
        if serialized_request is not None:
            ws_log_and_send_error(f'{str(e)}',
                                  serialized_request
                                  .connection_context.connection_id)
        else:
            logging.fatal('Cannot parse request at all. %s', e)
