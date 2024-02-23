"""
All data access related functions for chat messages.
"""

from typing import Sequence, Tuple, Literal, cast
from uuid import uuid4

import enum
from datetime import datetime
from sqlalchemy import Column, Enum, String, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from .common import Base

# pylint: disable=too-few-public-methods,too-many-ancestors


class ProcessedStatus(enum.Enum):
    """
    Enum representing if the upload has been processed by the vector
    database.
    """
    NOT_PROCESSED = 'not_processed'
    PROCESSED = 'processed'


class UploadsModel(Base):
    """
    Database model for file uploads.
    """
    __tablename__ = 'uploads'
    upload_id: Mapped[str] = mapped_column(String(36),
                                           primary_key=True,
                                           default=uuid4)
    filename: Mapped[str] = mapped_column()
    user_email: Mapped[str] = mapped_column()
    sent_at: Mapped[datetime] = mapped_column()
    processed: Column = Column(Enum(ProcessedStatus))
