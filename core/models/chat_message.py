"""
All data access related functions for chat messages.
"""

from typing import Sequence, Tuple, Literal, cast
from uuid import uuid4

import enum
from datetime import datetime
from sqlalchemy import Column, Enum, String, select, JSON
from sqlalchemy.orm import Mapped, Session, mapped_column
from utils.chat_message import BidirectionalChatMessage

from .common import Base

# pylint: disable=too-few-public-methods,too-many-ancestors


class SenderTypes(enum.Enum):
    """
    Enum representing all the types of senders available. Since this
    is a chatbot, the only two conversation partners are the bot and
    the user.
    """
    BOT = 'bot'
    USER = 'user'


class ChatMessageModel(Base):
    """
    Database model for the chat messages.
    This is modelled after BidirectionalChatMessage, but it is not equivalent.
    """
    __tablename__ = 'chat_messages'
    message_id: Mapped[str] = mapped_column(String(36), primary_key=True,
                                            default=uuid4)
    # TODO: We can probably 3NF this and make this a foreign key. This
    # is not very important for now, though
    conversation_id: Mapped[str] = mapped_column(default=uuid4)
    message: Mapped[str] = mapped_column()
    sent_at: Mapped[datetime] = mapped_column()
    is_image: Mapped[bool] = mapped_column(default=False)
    sender: Column = Column(Enum(SenderTypes))
    citations: Column = Column(JSON, nullable=True)

    # If image, additional context is the text interpretation of the image
    additional_context: Mapped[str] = mapped_column(default='')

    @staticmethod
    def from_bidirectional_chat_message(
            message: BidirectionalChatMessage,
            additional_context='') -> 'ChatMessageModel':
        """
        Converts a bidirectional chat message into a ChatMessageDTO.

        Args:
            message (BidirectionalChatMessage): The message to convert
            additional_context (str): Additional context to save
        """
        return ChatMessageModel(
            conversation_id=message.conversation_id,
            message=message.message,
            sent_at=message.sent_at,
            is_image=message.is_image,
            sender=SenderTypes(message.sender),
            citations=[citation.to_dict() for citation in message.citations],
            additional_context=additional_context,
        )

    @staticmethod
    def to_bidirectional_chat_message(
            message: 'ChatMessageModel') -> BidirectionalChatMessage:
        """
        Converts a chat message into a bidirectional chat message.
        (Note: The typing is intentional.)

        Args:
            message (ChatMessageModel): The message to convert

        Returns:
            BidirectionalChatMessage: The converted message

        Raises:
            ValueError: If the sender is None (this is an impossible case)
        """
        return BidirectionalChatMessage(
            conversation_id=message.conversation_id,
            message=message.message,
            sent_at=message.sent_at,
            is_image=message.is_image,
            # casted because message.sender (is a str) should
            # become either bot or user
            sender=cast(Literal['bot', 'user'], message.sender),
            citations=[citation.from_dict() for citation in message.citations]
        )


class ChatMessageDAO:
    """
    Methods used with the ChatMessageModel. These are namespaced, static
    methods. (i.e. do not instantitate)
    """
    def __init__(self):  # pragma: no cover
        # There is literally no point testing this
        raise NotImplementedError("do not instantiate")

    @staticmethod
    def get_all_messages_for_conversation(
            session: Session,
            conversation_id: str,
            *,
            msg_range: Tuple[int, int] = (-1, -1),
            count: int = -1

    ) -> Sequence[ChatMessageModel]:
        """
        Gets all the messages for a conversation. Guaranteed to be
        ordered correctly. If msg_range is not provided right
        (e.g. (a, b) but b > a), then the function will just return an
        empty list.

        Args:
            session (Session): The database session
            conversation_id (str): The conversation ID

        Keyword Args:
            msg_range (Tuple[int, int]): The range of messages to get
                                         in terms of
                                         timestamp. Inclusive of
                                         start, exclusive of end. Set
                                         any to -1 to "unspecify"
            count (int): The number of messages to limit. Overrides
                         the number of messages specified by the
                         range.

        Returns:
            Sequence[ChatMessageModel]: A sequence of all the messages
        """
        stmt = select(ChatMessageModel) \
            .where(ChatMessageModel.conversation_id == conversation_id) \
            .order_by(ChatMessageModel.sent_at.desc())
        if msg_range[0] != -1:
            stmt = stmt.where(ChatMessageModel.sent_at >= msg_range[0])
        if msg_range[1] != -1:
            stmt = stmt.where(ChatMessageModel.sent_at < msg_range[1])
        if count != -1:
            stmt = stmt.limit(count)

        return list(reversed(session.scalars(stmt).all()))

    @staticmethod
    def save_message(session: Session, message: ChatMessageModel) -> None:
        """
        Saves a chat message into the database.

        Args:
            session (Session): The database session
            message (BidirectionalChatMessage): The message to save
        """

        session.add(message)
        session.commit()
