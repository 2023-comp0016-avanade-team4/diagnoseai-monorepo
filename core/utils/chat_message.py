"""
Contains the chat mesage data class.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from typing import Literal

from dataclasses_json import DataClassJsonMixin, config


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
