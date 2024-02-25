"""
Chat History API endpoint.
"""

import logging
import os

import azure.functions as func  # type: ignore[import-untyped]
from models.chat_message import ChatMessageDAO, ChatMessageModel
from utils.db import create_session
from utils.history import ChatHistoryResponse
from utils.authorise_conversation import authorise_user
from utils.get_user_id import get_user_id


app = func.FunctionApp()

DATABASE_URL = os.environ["DatabaseURL"]
DATABASE_NAME = os.environ["DatabaseName"]
DATABASE_USERNAME = os.environ["DatabaseUsername"]
DATABASE_PASSWORD = os.environ["DatabasePassword"]
DATABASE_SELFSIGNED = os.environ.get("DatabaseSelfSigned")

# Global clients
db_session = create_session(
    DATABASE_URL,
    DATABASE_NAME,
    DATABASE_USERNAME,
    DATABASE_PASSWORD,
    bool(DATABASE_SELFSIGNED),
)


def get_history_from_db(convesation_id: str) -> map:
    """
    Gets the last 50 messages of the chat history from the database.

    Args:
        convesation_id (str): The conversation ID

    Returns:
        map: The chat history
    """
    return map(
        ChatMessageModel.to_bidirectional_chat_message,
        ChatMessageDAO.get_all_messages_for_conversation(
            db_session, convesation_id, count=50
        ),
    )


def handle_request_by_conversation_id(
    conversation_id: str
) -> ChatHistoryResponse:
    """
    Handles the request by conversation ID.

    Args:
        conversation_id (str): The conversation ID

    Returns:
        ChatHistoryResponse: The chat history response
    """
    return ChatHistoryResponse.from_dict(
        {"messages": list(get_history_from_db(conversation_id))}
    )


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Gets the chat history

    Args:
        req (func.HttpRequest): The HTTP request
    """
    logging.info("Chat History called with %s", req.method)
    if "conversation_id" not in req.params:
        return func.HttpResponse("", status_code=400)

    conversation_id = req.params.get("conversation_id")

    curr_user = get_user_id(req.params["Auth-Token"])
    if not authorise_user(db_session, conversation_id, curr_user):
        return func.HttpResponse("User not authorised.", status_code=401)

    return func.HttpResponse(
        handle_request_by_conversation_id(conversation_id).to_json(),
        status_code=200,
        mimetype="application/json",
    )
