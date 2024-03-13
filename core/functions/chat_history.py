"""
Chat History API endpoint.
"""

import logging
import os

import azure.functions as func  # type: ignore[import-untyped]
from azure.storage.blob import BlobServiceClient
from models.chat_message import ChatMessageDAO, ChatMessageModel
from utils.db import create_session
from utils.image_utils import get_preauthenticated_blob_url
from utils.history import ChatHistoryResponse

DATABASE_URL = os.environ['DatabaseURL']
DATABASE_NAME = os.environ['DatabaseName']
DATABASE_USERNAME = os.environ['DatabaseUsername']
DATABASE_PASSWORD = os.environ['DatabasePassword']
DATABASE_SELFSIGNED = os.environ.get('DatabaseSelfSigned')

IMAGE_BLOB_CONNECTION_STRING = os.environ["ImageBlobConnectionString"]
IMAGE_BLOB_CONTAINER = os.environ["ImageBlobContainer"]

# Global clients
db_session = create_session(
    DATABASE_URL, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD,
    bool(DATABASE_SELFSIGNED)
)

blob_service_client = BlobServiceClient.from_connection_string(
    IMAGE_BLOB_CONNECTION_STRING)


def __transform_chat_message_helper(model: ChatMessageModel):
    """
    Helper function to transform a chat message model into a
    bidirectional chat message.

    Args:
        model (ChatMessageModel): The model to transform

    Returns:
        BidirectionalChatMessage: The transformed model
    """
    bidirectional_chat_message = \
        ChatMessageModel.to_bidirectional_chat_message(model)
    if bidirectional_chat_message.is_image:
        bidirectional_chat_message.message = \
            get_preauthenticated_blob_url(
                blob_service_client, IMAGE_BLOB_CONTAINER,
                bidirectional_chat_message.message)
    return bidirectional_chat_message


def get_history_from_db(
        convesation_id: str) -> map:
    """
    Gets the last 50 messages of the chat history from the database.

    Args:
        convesation_id (str): The conversation ID

    Returns:
        map: The chat history
    """
    return map(__transform_chat_message_helper,
               ChatMessageDAO.get_all_messages_for_conversation(
                   db_session, convesation_id, count=50))


def handle_request_by_conversation_id(
        conversation_id: str) -> ChatHistoryResponse:
    """
    Handles the request by conversation ID.

    Args:
        conversation_id (str): The conversation ID

    Returns:
        ChatHistoryResponse: The chat history response
    """
    return ChatHistoryResponse.from_dict({
        'messages': list(get_history_from_db(conversation_id))})


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Gets the chat history

    Args:
        req (func.HttpRequest): The HTTP request
    """
    logging.info('Chat History called with %s', req.method)
    if 'conversation_id' not in req.params:
        return func.HttpResponse(
            '', status_code=400
        )

    conversation_id = req.params.get('conversation_id')
    return func.HttpResponse(
        handle_request_by_conversation_id(conversation_id).to_json(),
        status_code=200,
        mimetype='application/json'
    )