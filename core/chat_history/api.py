"""
Chat History API endpoint.
"""

import logging
import os
from json import JSONDecodeError

import azure.functions as func  # type: ignore[import-untyped]
from models.chat_message import ChatMessageDAO, ChatMessageModel
from utils.db import create_session
from utils.history import ChatHistoryResponse

SERVER_URL = os.environ['SERVER_URL']
DATABASE_NAME = os.environ['DATABASE_NAME']
USERNAME = os.environ['USERNAME']
PASSWORD = os.environ['PASSWORD']

# Global clients
db_session = create_session(
    SERVER_URL, DATABASE_NAME, USERNAME, PASSWORD
)


def get_history_from_db(
        convesation_id: str) -> map:
    """
    Gets the last 50 messages of the chat history from the database.

    Args:
        convesation_id (str): The conversation ID

    Returns:
        Generator[Any, Any, BidirectionalChatMessage]: The chat history
    """
    return map(ChatMessageModel.to_bidirectional_chat_message,
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
    try:
        if 'conversation_id' not in req.route_params:
            return func.HttpResponse(
                '', status_code=400
            )

        conversation_id = req.route_params.get('conversation_id')
        return func.HttpResponse(
            handle_request_by_conversation_id(conversation_id).to_json(),
            status_code=200,
            mimetype='application/json'
        )
    except (KeyError, JSONDecodeError) as e:
        logging.error('Cannot deserialize JSON %s', e)
        return func.HttpResponse(
            '', status_code=500
        )
