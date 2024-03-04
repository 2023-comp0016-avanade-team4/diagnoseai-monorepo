"""
Contains the chat mesage data class.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from typing import Literal

from dataclasses_json import DataClassJsonMixin, config


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
    index: str = field(default='validation-index')


@dataclass
class BidirectionalChatMessage(DataClassJsonMixin):
    """
    The BidirectionalChatMessage data class. This represents a message
    object that differentiate between the bot sender the actual user
    """
    message: str
    conversation_id: str = field(metadata=config(field_name="conversationId"))
    sent_at: datetime = field(metadata=config(field_name="sentAt"))
    sender: Literal['bot', 'user'] = field(metadata=config(field_name="sender"))
    index: str = field(default='validation-index')


@dataclass
class ResponseChatMessage(DataClassJsonMixin):
    """
    Response chat message data class.
    """
    body: str
    conversation_id: str = field(metadata=config(field_name="conversationId"))
    sent_at: datetime = field(metadata=config(field_name="sentAt"))
    type: str = 'message'


@dataclass
class ResponseErrorMessage(DataClassJsonMixin):
    """
    Represents an error.
    """
    body: str
    type: str = 'error'
