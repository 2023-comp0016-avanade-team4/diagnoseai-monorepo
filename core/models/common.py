"""
Common classes to contain common functionality for all database
features
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all subseqent models.
    """
