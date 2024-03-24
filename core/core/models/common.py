"""
Common classes to contain common functionality for all database
features
"""

from sqlalchemy.orm import DeclarativeBase


# This is a required class according to SQLAlchemy docs. Hence, all
# lints are invalid
# pylint: disable=too-few-public-methods
class Base(DeclarativeBase):
    """
    Base class for all subseqent models.
    """
