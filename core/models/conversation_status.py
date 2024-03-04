"""
The ConversationStatusModel represents the status of a conversation.
"""

import enum
import logging
from uuid import uuid4

from sqlalchemy import Column, Enum, String
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.exc import NoResultFound

from .common import Base


class ConversationCompletedStatus(enum.Enum):
    """
    Enum representing the completion status of a conversation.
    """
    NOT_COMPLETED = 'not_completed'
    COMPLETED = 'completed'


# pylint: disable=too-few-public-methods
class ConversationStatusModel(Base):
    """
    Database model for the conversation status.
    """
    __tablename__ = 'conversation_status'
    conversation_id: Mapped[str] = mapped_column(String(36), primary_key=True,
                                                 default=uuid4)
    status: Column = Column(Enum(ConversationCompletedStatus))

    @staticmethod
    def make_conversation_status(conversation_id: str,
                                 status: ConversationCompletedStatus) \
                                 -> 'ConversationStatusModel':
        """
        Creates a conversation status model.
        """
        return ConversationStatusModel(conversation_id=conversation_id,
                                       status=status)


class ConversationStatusDAO:
    """
    Data access object for the conversation status.
    """
    @staticmethod
    def is_conversation_completed(conversation_id: str,
                                  session: Session) -> bool:
        """
        Checks if a conversation is completed.

        Args:
            conversation_id (str): The conversation ID

        Returns:
            bool: True if the conversation is completed, False otherwise
        """
        try:
            model = session.get_one(ConversationStatusModel, conversation_id)
            return model.status.value == ConversationCompletedStatus.COMPLETED
        except NoResultFound:
            logging.warning(
                'Conversation %s not found in the database.'
                ' Returning as not completed.',
                conversation_id
            )
            return False

    @staticmethod
    def mark_conversation_completed(conversation_id: str,
                                    session: Session) -> None:
        """
        Marks a conversation as completed.

        Args:
            conversation_id (str): The conversation ID
            session (Session): The database session
        """
        session.merge(ConversationStatusModel.make_conversation_status(
            conversation_id, ConversationCompletedStatus.COMPLETED
        ))
        session.commit()

    @staticmethod
    def mark_conversation_not_completed(conversation_id: str,
                                        session: Session) -> None:
        """
        Marks a conversation as not completed.

        Args:
            conversation_id (str): The conversation ID
            session (Session): The database session
        """
        session.merge(ConversationStatusModel.make_conversation_status(
            conversation_id, ConversationCompletedStatus.NOT_COMPLETED
        ))
        session.commit()
