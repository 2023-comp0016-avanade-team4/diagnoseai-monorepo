"""
Contains the conversation data class
"""

from dataclasses import dataclass, field

from dataclasses_json import DataClassJsonMixin, config

@dataclass
class ChatConnectionRequest(DataClassJsonMixin):
    """
    A request to make a conversation.
    """
    user_id: str = field(metadata=config(field_name="userId"))


@dataclass
class ChatConnectionResponse(DataClassJsonMixin):
    """
    A response from making a conversation
    """
    ws_url: str = field(metadata=config(field_name="wsUrl"))
    ttl: int
