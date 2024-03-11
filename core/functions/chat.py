"""
Hooks to the DiagnoseAI Core's Web PubSub service. Once a message is
received, forwards the message to an OpenAI model, and publishes the
response.

References:
- https://techcommunity.microsoft.com/t5/apps-on-azure-blog/tutorial-azure-web-pubsub-trigger-for-azure-python-functions/ba-p/3650727 (setting up instructions)
- https://learn.microsoft.com/en-us/azure/azure-web-pubsub/reference-functions-bindings?tabs=csharp#usages (the function.json)
"""  # pylint: disable=line-too-long # noqa: E501

import base64
import logging
import os
from datetime import datetime
from json import JSONDecodeError
from typing import cast
from uuid import uuid4

from azure.messaging.webpubsubservice import \
    WebPubSubServiceClient  # type: ignore[import-untyped] # noqa: E501 # pylint: disable=line-too-long
from azure.storage.blob import BlobServiceClient
from openai import AzureOpenAI
from openai.types.chat import ChatCompletionMessageParam
from models.chat_message import ChatMessageDAO, ChatMessageModel, SenderTypes
from utils.chat_message import (BidirectionalChatMessage, ChatMessage,
                                ResponseChatMessage, ResponseErrorMessage)
from utils.db import create_session
from utils.image_summary import ImageSummary
from utils.image_utils import compress_image, is_url_encoded_image
from utils.web_pub_sub_interfaces import WebPubSubRequest
from utils.verify_token import verify_token

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

IMAGE_BLOB_CONNECTION_STRING = os.environ["ImageBlobConnectionString"]
IMAGE_BLOB_CONTAINER = os.environ["ImageBlobContainer"]

GPT4V_API_BASE = os.environ['GPT4V_API_BASE']
GPT4V_API_KEY = os.environ['GPT4V_API_KEY']
GPT4V_DEPLOYMENT_NAME = os.environ['GPT4V_DEPLOYMENT_NAME']

blob_service_client = BlobServiceClient.from_connection_string(
    IMAGE_BLOB_CONNECTION_STRING)

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

image_summary = ImageSummary(
    GPT4V_API_BASE, GPT4V_API_KEY, GPT4V_DEPLOYMENT_NAME
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
        conversation_id: str, message: str, sender_is_bot: bool,
        is_image: bool, additional_context: str = ''
) -> None:
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
                is_image=is_image,
                sender='bot' if sender_is_bot else 'user',
            ),
            additional_context
        )
    )


def db_history_to_ai_history(conversation_id: str, history_size: int = 10) \
        -> list[ChatCompletionMessageParam]:
    """
    Gets the history from the database and converts openai
    format. Pure images are ignored, because it is assumed that the
    interpeted text will be sent back to the user
    """
    history = ChatMessageDAO.get_all_messages_for_conversation(
        db_session, conversation_id, count=history_size)

    # Should either match ChatCompletionSystemMessageParam or
    # ChatCompletionUserMessageParam, so we cast to make typing happy
    return [
        cast(ChatCompletionMessageParam,
             {'role': 'assistant' if msg.sender == SenderTypes.BOT else 'user',
              'content': msg.message if not msg.is_image
              else msg.additional_context}
             ) for msg in history if not msg.is_image]


def ws_log_and_send_error(text: str, connection_id: str) -> None:
    """
    Logs an error and sends an error message through the websocket
    """
    logging.error('Cannot parse ChatMessage: %s', text)
    ws_send_message(ResponseErrorMessage(text).to_json(), connection_id)


def save_to_blob(filename: str, content: bytes):
    """
    Saves a blob to the Azure Blob Storage

    Args:
        filename (str): Filename to save the blob as
        content (bytes): Content in bytes to save
    """
    logging.info('Saving content to image blob storage as: %s', filename)
    # saves the content in bytes into the azure blob specified by
    # image endpoint
    blob_client = blob_service_client.get_blob_client(
        IMAGE_BLOB_CONTAINER, filename)
    try:
        blob_client.upload_blob(content)
    # NOTE: It's okay to do a catch all, because all errors that can
    # occur must come from uploading the blob / compressing the image
    except Exception as e:  # pylint: disable=[broad-exception-caught]
        logging.error('Unable to upload blob: %s', e)
        raise e


def __upload_image_to_blob(message: ChatMessage, compressed: bytes) -> str:
    try:
        iden = str(uuid4()).replace('-', '')
        filename = f'{iden}.jpg'
        save_to_blob(filename, compressed)
        return filename
    except Exception:  # pylint: disable=[broad-exception-caught]
        # Saving the image to blob storage isn't actually a critical
        # path, so the failover is to store the entire image
        # blob. Inefficient, but should work regardless
        logging.error(
            'Unable to save image to blob storage, continuing anyway')
        return message.message


def __process_message_image(message: ChatMessage,
                            connection_id: str) -> tuple[str, str]:
    """
    Processes image found in the message, and returns the file name

    Args:
        message (ChatMessage): The ChatMessage object deserialize from the
                               input
        connection_id (str): The connection ID of the websocket in question

    Returns:
        Tuple[str, str]: filename and summary
    """
    logging.info('message claims to be an image %s', connection_id)
    if not is_url_encoded_image(message.message):
        ws_log_and_send_error(
            ('message claims to be an image, but is not a URL encoded'
             f' image. for debugging purposes, you were {connection_id}'),
            connection_id)
        raise RuntimeError('message is not a URL encoded image')

    logging.info('message is a URL encoded image %s', connection_id)
    image = message.message.split(',')[1]
    try:
        compressed = compress_image(base64.b64decode(image))
        compressed_object_url = (
            "data:image/jpeg;base64,"
            f"{base64.b64encode(compressed).decode()}")
    except OSError as e:
        ws_log_and_send_error(
            ('message claims to be an image, but cannot be compressed.'
             f' for debugging purposes, you were {connection_id}'),
            connection_id)
        raise e

    filename = __upload_image_to_blob(message, compressed)

    try:
        summary = image_summary.get_image_summary(compressed_object_url)
    except Exception as e:  # pylint: disable=[broad-exception-caught]
        ws_log_and_send_error(
            ('message claims to be an image, but cannot be interpreted.'
                f' for debugging purposes, you were {connection_id}'),
            connection_id)
        raise e
    return (filename, summary)


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

    logging.info('%s: sending to model', connection_id)
    messages = db_history_to_ai_history(message.conversation_id)

    if message.is_image:
        (filename, summary) = __process_message_image(message, connection_id)

        # send the summary as the user, but save it as a bot
        contextualized_summary = f"USER IMAGE: {summary}"
        messages.append({'role': 'user', 'content': contextualized_summary})
        shadow_msg_to_db(message.conversation_id, filename, False, True,
                         contextualized_summary)
        shadow_msg_to_db(message.conversation_id, contextualized_summary, True,
                         False)
        ws_send_message(
            ResponseChatMessage(
                summary,
                message.conversation_id,
                datetime.now()).to_json(),
            connection_id)
        return

    messages.append({'role': 'user', 'content': message.message})
    shadow_msg_to_db(message.conversation_id, message.message, False,
                     False)

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
                        "inScope": True,
                        "filter": None,
                        "strictness": 3,
                        "topNDocuments": 5,
                        "roleInformation": ('You are a helpful chatbot named'
                                            ' DiagnoseAI. You have access'
                                            ' to technical manuals via a'
                                            ' connected data source.'
                                            ' Users are able to upload'
                                            ' images to contextualize their'
                                            ' conversations; you will observe'
                                            ' these as a message prefixed by'
                                            ' "USER IMAGE:". If you see'
                                            ' "USER IMAGE:", it is a'
                                            ' factual description of the'
                                            ' image uploaded by the user.'
                                            ' All references to "image" or'
                                            ' "images" always refer to'
                                            ' the description in "USER'
                                            ' IMAGE:". Answer accordingly to'
                                            ' all user images and data'
                                            ' sources you have access to.')
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
    shadow_msg_to_db(message.conversation_id, response.body, True, False)
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
