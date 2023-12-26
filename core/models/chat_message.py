"""
All data access related functions for chat messages.
"""

from typing import Sequence, Tuple, Literal, cast
from uuid import uuid4

from datetime import datetime
from sqlalchemy import DateTime, Enum, select
from sqlalchemy.orm import Mapped, Session, mapped_column
from utils.chat_message import BidirectionalChatMessage

from .common import Base

# pylint: disable=too-few-public-methods,too-many-ancestors


class SenderTypes(Enum):
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
    message_id: Mapped[str] = mapped_column(primary_key=True, default=uuid4)
    # TODO: We can probably 3NF this and make this a foreign key. This
    # is not very important for now, though
    conversation_id: Mapped[str] = mapped_column(default=uuid4)
    order: Mapped[int] = mapped_column()
    message: Mapped[str] = mapped_column()
    sent_at: Mapped[DateTime] = mapped_column()
    sender: Mapped[SenderTypes] = mapped_column()

    @staticmethod
    def from_bidirectional_chat_message(
            message: BidirectionalChatMessage) -> 'ChatMessageModel':
        """
        Converts a bidirectional chat message into a ChatMessageDTO.

        Args:
            message (BidirectionalChatMessage): The message to convert
        """
        return ChatMessageModel(
            conversation_id=message.conversation_id,
            message=message.message,
            sent_at=message.sent_at,
            sender=SenderTypes(message.sender)
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
        if message.sender.name is None:
            raise ValueError("sender is None (impossible case)")

        return BidirectionalChatMessage(
            conversation_id=message.conversation_id,
            message=message.message,
            sent_at=cast(datetime, message.sent_at),
            # casted because message.sender.name (is a str) should
            # become either bot or user
            sender=cast(Literal['bot', 'user'], message.sender.name)
        )


class ChatMessageDAO:
    """
    Methods used with the ChatMessageModel. These are namespaced, static
    methods. (i.e. do not instantitate)
    """
    def __init__(self):
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
        ordered correctly.

        Args:
            session (Session): The database session
            conversation_id (str): The conversation ID

        Keyword Args:
            msg_range (Tuple[int, int]): The range of messages to
                                         get. Inclusive of start ,
                                         exclusive of end. Set any to
                                         -1 to "unspecify"
            count (int): The number of messages to limit. Overrides
                         the number of messages specified by the
                         range.

        Returns:
            Sequence[ChatMessageModel]: A sequence of all the messages
        """
        stmt = select(ChatMessageModel) \
            .where(ChatMessageModel.conversation_id == conversation_id)
        if msg_range[0] != -1:
            stmt = stmt.where(ChatMessageModel.order >= msg_range[0])
        if msg_range[1] != -1:
            stmt = stmt.where(ChatMessageModel.order < msg_range[1])
        if count != -1:
            stmt = stmt.limit(count)

        stmt.order_by(ChatMessageModel.order)
        return session.scalars(stmt).all()

    @staticmethod
    def save_message(session: Session, message: ChatMessageModel) -> None:
        """
        Saves a chat message into the database.

        Args:
            session (Session): The database session
            message (BidirectionalChatMessage): The message to save
        """
        conversation_id = message.conversation_id
        past_messages = ChatMessageDAO.get_all_messages_for_conversation(
            session, conversation_id
        )
        if len(past_messages) > 0:
            message.order = past_messages[-1].order + 1
        else:
            message.order = 0

        session.add(message)
        session.commit()
