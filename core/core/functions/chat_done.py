"""
Chat done API endpoint.

This API is called by the web app endpoint whenever a conversation is
complete.
"""

import logging
from functools import reduce
from typing import Optional

import azure.functions as func  # type: ignore[import-untyped]
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores.azuresearch import AzureSearch
from models.chat_message import ChatMessageDAO
from models.conversation_status import ConversationStatusDAO
from utils.authorise_conversation import authorise_user
from utils.get_user_id import get_user_id
from utils.hashing import get_search_index_for_user_id
from utils.secrets import Secrets
from utils.services import Services

SUMMARIZATION_PROMPT = (
    "You are a summarization service. You will be iteratively passed chunks of"
    " an entire chat history. Each message either begins with BOT or USER,"
    " which represents the two different parties of the conversation. If the"
    " message contains [USER IMAGE], it is the description of an image"
    " uploaded by the USER, irregardless of the sender. You will receive, in"
    " order, both the summary thus far (role: assistant), and the next chunk"
    " of the conversation (role: user). You should summarize the conversation"
    " up to that point."
)


def __obtain_summary(prev_summary: str, next_chunk: str) -> str:
    """
    Obtains the summary of a conversation.

    Args:
        prev_summary (str): The previous summary
        next_chunk (str): The next chunk of the conversation
    """
    chat_response = Services().openai_chat_model.chat.completions.create(
        model=Secrets().get("SummarizationModel"),
        messages=[{
            "role": "system",
            "content": SUMMARIZATION_PROMPT
        }, {
            "role": "assistant",
            "content": prev_summary
        }, {
            "role": "user",
            "content": next_chunk
        }],
    )

    response = chat_response.choices[0].message.content
    assert response is not None
    return response


def __summarize_conversation(conversation_id: str) -> str:
    """
    Naively summarizes a conversation. The process is as follows:

    1. Get all messages for the conversation
    2. Join all messages together
    3. Use a text splitter to chunk the messages
    4. Use a GPT model to iteratively summarize the conversation

    Args:
        conversation_id (str): The conversation ID

    Returns:
        str: The summarized conversation
    """
    logging.info('Summarizing conversation %s', conversation_id)
    conversations = ChatMessageDAO.get_all_messages_for_conversation(
        Services().db_session, conversation_id)
    combined = '\n'.join([f"{c.sender}: {c.message}" for c in conversations])
    text_splitter = RecursiveCharacterTextSplitter()
    return reduce(__obtain_summary, text_splitter.split_text(combined), "")


def __store_into_index(index: str, data: str) -> None:
    """
    Stores data into an index. Meant to store summaries for a particular user.

    Args:
        index (str): The index to store into
        data (str): The data to store
    """
    logging.info('Storing into index %s', index)
    vector_store = AzureSearch(
        azure_search_endpoint=Secrets().get("SummarySearchEndpoint"),
        azure_search_key=Secrets().get("SummarySearchKey"),
        index_name=index,
        embedding_function=Services().embeddings.embed_query
    )
    vector_store.add_documents(documents=[
        Document(page_content=data, metadata={'source': 'local'})])


def summarize_and_store(user_id: str, conversation_id: str) -> None:
    """
    Summarizes and stores a conversation.

    Args:
        user_id (str): The user ID
        conversation_id (str): The conversation ID
    """
    index = get_search_index_for_user_id(user_id)
    __store_into_index(index, __summarize_conversation(conversation_id))


def __guards(req: func.HttpRequest
             ) -> tuple[Optional[func.HttpResponse], str, str, bool]:
    """
    Guards for the chat done endpoint.

    Args:
        req (func.HttpRequest): The HTTP request

    Returns:
        tuple[Optional[func.HttpResponse], str, str, bool]:
            The guard response, the user ID, and the conversation ID
    """
    if 'conversation_id' not in req.params:
        logging.info('Missing conversation id')
        return func.HttpResponse(
            'Missing conversation ID', status_code=400
        ), '', '', False

    if 'done' not in req.params:
        logging.info('Missing done param')
        return func.HttpResponse(
            'Missing done parameter', status_code=400
        ), '', '', False

    user_id = get_user_id(req.headers['Auth-Token'])
    conversation_id = req.params['conversation_id']

    try:
        done = req.params['done'].lower() == 'true'
    except ValueError:
        logging.error('Cannot turn doen to boolean')
        return func.HttpResponse(
            'Invalid parameters', status_code=400
        ), '', '', False

    assert user_id is not None
    if not authorise_user(Services().db_session, conversation_id, user_id):
        logging.info('User not authorised to access conversation')
        return func.HttpResponse(
            'Conversation does not belong to user', status_code=401
        ), '', '', False
    return None, user_id, conversation_id, done


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Marks a conversation as completed.

    Args:
        req (func.HttpRequest): The HTTP request
    """
    guard_res, user_id, conversation_id, done = __guards(req)
    if guard_res:
        return guard_res

    logging.info('Chat Done called with %s', req.method)
    if done:
        ConversationStatusDAO.mark_conversation_completed(
            req.params['conversation_id'], Services().db_session)
        summarize_and_store(user_id, conversation_id)
    else:
        ConversationStatusDAO.mark_conversation_not_completed(
            req.params['conversation_id'], Services().db_session)
    return func.HttpResponse(
        '', status_code=200
    )
