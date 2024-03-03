"""
Chat done API endpoint.

This API is called by the web app endpoint whenever a conversation is
complete.
"""

import logging
import os
from json import JSONDecodeError

import azure.functions as func  # type: ignore[import-untyped]
from azure.search.documents.indexes import SearchIndexClient  # type: ignore[import-untyped] # noqa: E501 # pylint: disable=line-too-long
from functools import reduce
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from openai import AzureOpenAI
from models.chat_message import ChatMessageDAO
from models.conversation_status import ConversationStatusDAO
from utils.db import create_session
from utils.verify_token import verify_token
from utils.get_user_id import get_user_id
from langchain.vectorstores.azuresearch import AzureSearch
from langchain.embeddings import AzureOpenAIEmbeddings

# Environment Variables / Constants

OPENAI_KEY = os.environ["OpenAIKey"]
OPENAI_ENDPOINT = os.environ["OpenAIEndpoint"]
SUMMARIZATION_MODEL = os.environ["SummarizationModel"]

DATABASE_URL = os.environ['DatabaseURL']
DATABASE_NAME = os.environ['DatabaseName']
DATABASE_USERNAME = os.environ['DatabaseUsername']
DATABASE_PASSWORD = os.environ['DatabasePassword']
DATABASE_SELFSIGNED = os.environ.get('DatabaseSelfSigned')

SEARCH_KEY = os.environ["SummarySearchKey"]
SEARCH_ENDPOINT = os.environ["SummarySearchEndpoint"]

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

# Global Clients

logging.basicConfig(level=logging.INFO)

ai_client = AzureOpenAI(
    base_url=(f"{OPENAI_ENDPOINT}/openai/deployments/"
              "validation-testing-model"),
    api_key=OPENAI_KEY,
    api_version='2024-02-15-preview'
)

db_session = create_session(
    DATABASE_URL, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD,
    bool(DATABASE_SELFSIGNED)
)

embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-ada-002",
    api_version="2023-05-15",
)


def __obtain_summary(prev_summary: str, next_chunk: str) -> str:
    """
    Obtains the summary of a conversation.

    Args:
        prev_summary (str): The previous summary
        next_chunk (str): The next chunk of the conversation
    """
    chat_response = ai_client.chat.completions.create(
        model=SUMMARIZATION_MODEL,
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

    return chat_response.choices[0].message['content']


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
        db_session, conversation_id)
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
        azure_search_endpoint=SEARCH_ENDPOINT,
        azure_search_key=SEARCH_KEY,
        index_name=index,
        embedding_function=embeddings.embed_query
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
    __store_into_index(f'{user_id}-summaries',
                       __summarize_conversation(conversation_id))


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Marks a conversation as completed.

    Args:
        req (func.HttpRequest): The HTTP request
    """
    if not req.method == 'POST':
        return func.HttpResponse(
            'Unknown HTTP method', status_code=400
        )

    if not verify_token(req.headers['Auth-Token']):
        return func.HttpResponse(
            'Missing auth token', status_code=401
        )

    if 'conversation_id' not in req.params:
        return func.HttpResponse(
            'Missing conversation ID', status_code=400
        )

    user_id = get_user_id(req.headers['Auth-Token'])
    conversation_id = req.params['conversation_id']

    # TODO: one more check to see if user actually has access to work order
    # ideally all of the above guards should be in its own function

    logging.info('Chat Done called with %s', req.method)
    try:
        ConversationStatusDAO.mark_conversation_completed(
            req.params['conversation_id'], db_session)
        summarize_and_store(user_id, conversation_id)
        return func.HttpResponse(
            '', status_code=200
        )
    except JSONDecodeError:
        return func.HttpResponse(
            '', status_code=400
            )
