"""
Contains the chat mesage data class.
"""

from dataclasses import dataclass, field
from datetime import datetime

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
    sent_at: datetime = field(metadata=config(field_name="sentAt"))


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
