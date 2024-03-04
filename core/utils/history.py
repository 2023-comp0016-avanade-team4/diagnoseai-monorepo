"""
Utiltiies for the message history endpoint
"""

from dataclasses import dataclass
from dataclasses_json import DataClassJsonMixin

from .chat_message import BidirectionalChatMessage

@dataclass
class ChatHistoryResponse(DataClassJsonMixin):
    """
    Represents the response from the chat history endpoint.
    """
    messages: list[BidirectionalChatMessage]
    conversation_done: bool
