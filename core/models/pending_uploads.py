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
    username: Mapped[str] = mapped_column()
    user_email: Mapped[str] = mapped_column()
    machine_id: Mapped[str] = mapped_column()
    sent_at: Mapped[datetime] = mapped_column(default=datetime.now())

    @staticmethod
    def make_model(filename: str, username: str, user_email: str,
                   machine_id: str):
        """
        Makes a model from the given parameters.

        Args:
            filename (str): The filename
            username (str): The username
            user_email (str): The user's email
            machine_id (str): The machine ID

        Returns:
            PendingUploadsModel: The model
        """
        return PendingUploadsModel(filename=filename,
                                   username=username,
                                   user_email=user_email)


class PendingUploadsDAO:
    """
    The data access object for an pending upload.
    """

    @staticmethod
    def add_pending_upload(session: Session,
                           model: PendingUploadsModel) -> None:
        """
        Adds a pending upload to the database.

        Args:
            session (Session): The database session
            model (PendingUploadsModel): The model to add
        """
        session.add(model)
        session.commit()

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
                                      ) -> list[PendingUploadsModel]:
        """
        Gets all unprocessed filenames and their associated email.

        Args:
            session (Session): The database session

        Returns:
            list[PendingUploadsModel]: The unprocessed filenames and email
        """
        return session.query(PendingUploadsModel).all()
