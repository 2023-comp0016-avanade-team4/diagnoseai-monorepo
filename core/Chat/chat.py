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

from azure.messaging.webpubsubservice import WebPubSubServiceClient  # type: ignore[import-untyped] # noqa: E501 # pylint: disable=line-too-long
from openai import AzureOpenAI
from utils.chat_message import (ChatMessage, ResponseChatMessage,
                                ResponseErrorMessage)
from utils.web_pub_sub_interfaces import WebPubSubRequest

# Load required variables from the environment

WPBSS_CONNECTION_STRING = os.environ['WebPubSubConnectionString']
WPBSS_HUB_NAME = os.environ['WebPubSubHubName']

OPENAI_KEY = os.environ["OpenAIKey"]
OPENAI_ENDPOINT = os.environ["OpenAIEndpoint"]

# Global clients

logging.basicConfig(level=logging.INFO)

ai_client = AzureOpenAI(
    azure_endpoint=OPENAI_ENDPOINT,
    api_key=OPENAI_KEY,
    api_version='2023-05-15'
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


def ws_log_and_send_error(text: str, connection_id: str) -> None:
    """
    Logs an error and sends an error message through the websocket
    """
    logging.error('Cannot parse ChatMessage: %s', text)
    ws_send_message(ResponseErrorMessage(text).to_json(), connection_id)


def process_message(message: ChatMessage, connection_id: str) -> None:
    """
    Processes the message received from the request.

    TODO: change behaviour to actually use a deployment with the data
    source AND consider context

    For now, the message goes directly into Azure OpenAI, which spits
    out a chat message.

    Args:
        message (ChatMessage): The ChatMessage object deserialize from the
                               input
        connection_id (str): The conneciton ID of the websocket in question
    """
    logging.info('%s: sending to model', connection_id)
    chat_response = ai_client.chat.completions.create(
        model='validation-testing-model',
        messages=[
            {'role': 'system',
             'content':
             ('You will append "THIS IS A TEST, NO HISTORICAL CONTEXT WILL '
              'BE SENT" to all subsequent messages.')},
            {'role': 'user',
             'content': message.message}
        ]
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
