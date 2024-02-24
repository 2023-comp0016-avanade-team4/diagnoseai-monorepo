"""
All data access related functions for chat messages.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, delete, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from .common import Base

# pylint: disable=too-few-public-methods,too-many-ancestors


class PendingUploadsModel(Base):
    """
    Database model for pending file uploads.
    """
    __tablename__ = 'pending_uploads'
    upload_id: Mapped[str] = mapped_column(String(36),
                                           primary_key=True,
                                           default=uuid4)
    filename: Mapped[str] = mapped_column()
    user_email: Mapped[str] = mapped_column()
    sent_at: Mapped[datetime] = mapped_column(default=datetime.now())


class PendingUploadsDAO:
    """
    The data access object for an pending upload.
    """
    @staticmethod
    def delete_for_filename(session: Session,
                            filename: str) -> None:
        """
        Delete an entry associated to the filename.
        Usually, this is called after the file has been processed.

        Args:
            session (Session): The database session
            filename (str): The filename
        """
        stmt = delete(PendingUploadsModel).where(
            PendingUploadsModel.filename == filename)
        session.execute(stmt)
        session.commit()

    @staticmethod
    def get_all_unprocessed_filenames(session: Session
                                      ) -> list[tuple[str, str]]:
        """
        Gets all unprocessed filenames and their associated email.

        Args:
            session (Session): The database session

        Returns:
            list[tuple[str, str]]: The unprocessed filenames and email
        """
        stmt = select(PendingUploadsModel.filename,
                      PendingUploadsModel.user_email)
        return [(row[0], row[1]) for row in session.execute(stmt)]
