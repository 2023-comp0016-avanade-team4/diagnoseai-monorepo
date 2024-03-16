"""
Contains the chat mesage data class.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from typing import Literal
from azure.storage.blob import BlobServiceClient

from dataclasses_json import DataClassJsonMixin, config
from utils.get_preauthenticated_blob_url import get_preauthenticated_blob_url


@dataclass
class Citation(DataClassJsonMixin):
    """
    Represents a citation with content, title, URL, filepath, and chunk ID.
    """
    content: str
    title: Optional[str]
    url: Optional[str]
    filepath: Optional[str]
    chunk_id: Optional[str]


@dataclass
class ChatMessage(DataClassJsonMixin):
    """
    The ChatMessage data class. This represents a message object.

    Instead of using the @dataclass_json annotation, we use the mixin
    so that editors and linters are happy.
    """
    message: str
    conversation_id: str = field(metadata=config(field_name="conversationId"))
    auth_token: Optional[str] = field(metadata=config(field_name="authToken"))
    sent_at: datetime = field(metadata=config(field_name="sentAt"))
    is_image: bool = field(
        default=False, metadata=config(field_name="isImage"))
    index: str = field(default='validation-index')
    citations: Optional[list[Citation]] = field(default_factory=list)


@dataclass
class BidirectionalChatMessage(DataClassJsonMixin):
    """
    The BidirectionalChatMessage data class. This represents a message
    object that differentiate between the bot sender the actual user.

    This class more closely represents the database structure, which
    does not contain the auth token.
    """
    message: str
    conversation_id: str = field(metadata=config(field_name="conversationId"))
    sent_at: datetime = field(metadata=config(field_name="sentAt"))
    is_image: bool = field(
        default=False, metadata=config(field_name="isImage"))
    sender: Literal['bot', 'user'] = field(
        default='bot', metadata=config(field_name="sender"))
    index: str = field(default='validation-index')
    citations: Optional[list[Citation]] = field(default_factory=list)


@dataclass
class ResponseChatMessage(DataClassJsonMixin):
    """
    Response chat message data class.
    """
    body: str
    conversation_id: str = field(metadata=config(field_name="conversationId"))
    sent_at: datetime = field(metadata=config(field_name="sentAt"))
    citations: Optional[list[Citation]] = field(default_factory=list)
    type: str = 'message'


@dataclass
class ResponseErrorMessage(DataClassJsonMixin):
    """
    Represents an error.
    """
    body: str
    type: str = 'error'


def translate_citation_urls(citations: list[Citation],
                            blob_service_client: BlobServiceClient,
                            container: str) -> list[Citation]:
    """
    Immutabily translates citation URLs to preauthenticated blob URLs
    to the filepaths of the given citations.

    Args:
        citations (list[Citation]): The citations to translate
        blob_service_client (BlobServiceClient): The blob service client
        container (str): The container to use
    """
    def __transform_helper(citation: Citation):
        return Citation(
            content=citation.content,
            title=citation.title,
            url=citation.url,
            filepath=get_preauthenticated_blob_url(
                blob_service_client,
                container,
                citation.filepath
            ) if not citation.filepath is None else '',
            chunk_id=citation.chunk_id
        )

    return [__transform_helper(citation) for citation in citations]
