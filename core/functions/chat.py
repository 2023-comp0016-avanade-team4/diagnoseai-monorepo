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
import re
from datetime import datetime
from json import JSONDecodeError
from typing import Callable, cast
from uuid import uuid4

from azure.core.exceptions import ResourceNotFoundError
from openai.types.chat import ChatCompletionMessageParam
from models.chat_message import ChatMessageDAO, ChatMessageModel, SenderTypes
from utils.authorise_conversation import authorise_user
from utils.chat_message import (BidirectionalChatMessage, ChatMessage,
                                ResponseChatMessage, ResponseErrorMessage,
                                Citation, translate_citation_urls)
from utils.get_user_id import get_user_id
from utils.hashing import get_search_index_for_user_id
from utils.image_utils import compress_image, is_url_encoded_image
from utils.verify_token import verify_token
from utils.web_pub_sub_interfaces import WebPubSubRequest
from utils.services import Services
from utils.secrets import Secrets

# Get services singleton

DOCUMENT_PROMPT = """
You are a helpful chatbot named DiagnoseAI. You also go by "BOT", "the bot". You have access to technical manuals via a connected data source. Users are able to upload images to contextualize their conversations; you will observe these as a message prefixed by "USER IMAGE:". If you see "USER IMAGE:", it is a factual description of the image uploaded by the user. All references to "image" or "images" always refer to the description in "USER IMAGE:". You will be given a user summary representing all past conversations with the user to better contextualize your answer. If using the summary, reference it in the text with [summary]. If the summary is "The requested information is not available in the retrieved data. Please try another query or topic.", then ignore the summary. Answer accordingly to all user images and data sources you have access to. SUMMARY: """  # noqa: E501

SUMMARY_PROMPT = """
You are a helpful chatbot named DiagnoseAI. You have access to the summaries of previous conversations with the user via a connected data source. Users are able to upload images to contextualize their conversations; you will observe these as a message prefixed by "USER IMAGE:". If you see "USER IMAGE:", it is a factual description of the image uploaded by the user. All references to "image" or "images" always refer to the description in "USER IMAGE:". Based on the information you have, return a relevant user summary. If no such summary exists, simply output NONE. """  # noqa: E501

OPENAI_API_VERSION = '2024-03-01-preview'
EMBEDDING_DEPLOYMENT_NAME = "text-embedding-ada-002"

logging.basicConfig(level=logging.INFO)


class ChatError(Exception):
    """
    Represents a chat-related error. The exception raiser should be
    the one that handles the exception (e.g. send error messages to
    the WebSocket)
    """


def ws_send_message(text: str, connection_id: str) -> None:
    """
    Sends a message over WebSockets.

    Args:
        text (str): The text to send
        connection_id (str): The connection ID to send to
    """
    Services().webpubsub.send_to_connection(connection_id,
                                            text,
                                            content_type='application/json')


# Default value not dangerous, if no citations given, we rather have
# an empty list than None
# pylint: disable=too-many-arguments
def shadow_msg_to_db(
        conversation_id: str, message: str, sender_is_bot: bool,
        is_image: bool, citations: list[Citation],
        additional_context: str = ''
) -> None:
    """
    Shadows the message to the database.

    Args:
        conversation_id (str): The conversation ID
        message (str): The message
        sender_is_bot (bool): Whether the sender is a bot
        is_image (bool): Whether the message is an image
        citations (list[Citation]): The citations
        additional_context (str, optional): Additional context. Defaults to ''.
    """
    # Ethereal messages; don't store history
    if conversation_id == '-1':
        logging.info('Ethereal conversation, not storing history')
        return

    ChatMessageDAO.save_message(
        Services().db_session,
        ChatMessageModel.from_bidirectional_chat_message(
            BidirectionalChatMessage(
                message=message,
                conversation_id=conversation_id,
                sent_at=datetime.now(),
                is_image=is_image,
                citations=citations,
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
        Services().db_session, conversation_id, count=history_size)

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
    blob_client = Services().image_blob_client.get_blob_client(
        Secrets().get("ImageBlobContainer"), filename)
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
        summary = Services().image_summary_model.get_image_summary(
            compressed_object_url)
    except Exception as e:  # pylint: disable=[broad-exception-caught]
        ws_log_and_send_error(
            ('message claims to be an image, but cannot be interpreted.'
                f' for debugging purposes, you were {connection_id}'),
            connection_id)
        raise e
    return (filename, summary)


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
        Services().search_index_client.get_index(index_name)
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


# pylint: disable=too-many-arguments # noqa: E501
def __query_llm_with_index(
        messages: list[ChatCompletionMessageParam],
        document_index: str,
        search_endpoint: str,
        search_key: str,
        prompt: str,
        connection_id: str) -> tuple[str, list[Citation]]:
    """
    Queries the AI model from the validation document index.

    Args:
        messages (list[ChatCompletionMessageParam]): The messages to
            send to the model
        document_index (str): The document index to query
        search_endpoint (str): The search endpoint
        search_key (str): The search key
        prompt (str): Model Prompt
        connection_id (str): The connection ID

    Returns:
        tuple[str, list[Citation]]: The response and the citations
    """
    best_response = None

    for max_history in [10, 5, 1]:
        logging.info('Trying max_history=%d', max_history)
        embedding_endpoint = Secrets().get("OpenAIEndpoint")
        embedding_key = Secrets().get("OpenAIKey")
        chat_response = Services().openai_chat_model.chat.completions.create(
            model=Secrets().get("OpenAIModelName"),
            extra_body={
                "data_sources": [
                    {
                        "type": "AzureCognitiveSearch",
                        "parameters": {
                            "endpoint": search_endpoint,
                            "key": search_key,
                            "indexName": document_index,
                            "semanticConfiguration": "default",
                            "queryType": "vector",
                            "embeddingEndpoint": (
                                f"{embedding_endpoint}/openai/"
                                f"deployments/{EMBEDDING_DEPLOYMENT_NAME}/"
                                f"embeddings?api-version={OPENAI_API_VERSION}"
                            ),
                            "embeddingKey": embedding_key,
                            "fieldsMapping": {
                                "filepath_field": "filepath"
                            },
                            "inScope": True,
                            "filter": None,
                            "strictness": 1,
                            "topNDocuments": 5,
                            "roleInformation": prompt
                        }
                    }
                ],
            },
            messages=messages[-max_history:],
            temperature=0,
            top_p=1,
            max_tokens=800,
        )

        if best_response is None:
            best_response = chat_response

        assert best_response is not None
        # Subtle note: It is GUARANTEED by the python implementation
        # of max that in the event of a tie, it will be the first
        # argument
        best_response = max(best_response, chat_response,
                            key=lambda x:
                            len(x.choices[0].message.context['citations'])  # type: ignore # noqa: E501
                            if len(x.choices) > 0 else 0)

        # break early, if there are already citations it should be
        # quite relevant to the context
        if len(best_response.choices) > 0 and \
           len(best_response.choices[0].message.context['citations']) > 0:  # type: ignore # noqa: E501
            break

    assert best_response is not None
    logging.info('%s: model response received', connection_id)
    if len(best_response.choices) == 0 \
       or best_response.choices[0].message.content is None:
        ws_log_and_send_error(
            ('no response from AI chat.'
             f' for debugging purposes, you were {connection_id}'),
            connection_id)
        raise ChatError('no response from AI chat')

    citations: list[Citation] = [
        Citation.from_dict(raw_citation)
        for raw_citation in (
            # Context definitely exists; but the SDK doesn't know it.
            best_response.choices[0].message.context['citations']  # type: ignore # noqa: E501
        )
    ]
    return best_response.choices[0].message.content, citations


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
    # Ethereal Conversations are denoted with a -1. They are
    # converesations that do not store history, and exists for the
    # purposes of validation.  Since they do not store state
    # (i.e. chat history), we can assume the all users are authorised
    # to use ethereal chats.
    ethereal_conversation = message.conversation_id == '-1'
    if not ethereal_conversation and \
       not authorise_user(Services().db_session, message.conversation_id,
                          curr_user):
        ws_log_and_send_error(
            ('User not authorised.'
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
        shadow_msg_to_db(message.conversation_id, filename, False, True, [],
                         additional_context=contextualized_summary)
        shadow_msg_to_db(message.conversation_id, contextualized_summary, True,
                         False, [])
        ws_send_message(
            ResponseChatMessage(
                summary,
                message.conversation_id,
                datetime.now()).to_json(),
            connection_id)
        return

    messages.append({'role': 'user', 'content': message.message})
    shadow_msg_to_db(message.conversation_id, message.message, False, False,
                     [])

    assert curr_user is not None
    summary_index = get_search_index_for_user_id(curr_user)
    summary_search_endpoint = Secrets().get("SummarySearchEndpoint")
    summary_search_key = Secrets().get("SummarySearchKey")

    try:
        if ethereal_conversation:
            summary = ''
        else:
            summary = __index_guard(summary_index,
                                    lambda: strip_all_citations(
                                        __query_llm_with_index(
                                            messages, summary_index,
                                            summary_search_endpoint,
                                            summary_search_key,
                                            SUMMARY_PROMPT, connection_id)[0]))

        chat_response, citations = __query_llm_with_index(
            messages, message.index,
            summary_search_endpoint, summary_search_key,
            DOCUMENT_PROMPT + summary, connection_id
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
        body=chat_response,
        conversation_id=message.conversation_id,
        sent_at=datetime.now(),
        citations=translate_citation_urls(
            citations, Services().doc_blob_client,
            Secrets().get("DocumentProductionContainerName")
        )
    )
    shadow_msg_to_db(
        message.conversation_id, response.body, True, False,
        citations)
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
