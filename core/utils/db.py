"""
Common database methods, including the estabishment of the DB session.

This is written in the context of functional apps, so the assumption
is that the caller will only need the session.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models.common import Base


def create_session(
        server_url: str,
        database_name: str,
        username: str,
        password: str,
        self_signed: bool) -> Session:  # pragma: no cover
    """
    Creates a database session.

    Args:
        server_url (str): The server URL
        database_name (str): The database name
        username (str): The username
        password (str): The password
        self_signed (bool): Indiciates if the cetificate is self-signed

    Returns:
        Session: The database session
    """
    # This instantiates the session, and cannot be unit tested.
    engine = create_engine(
        f"mssql+pyodbc://{username}:{password}@{server_url}/{database_name}"
        f"?driver=ODBC+Driver+18+for+SQL+Server"
        f"&Encrypt=yes"
        f"&TrustServerCertificate={'yes' if self_signed else 'no'}"
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()
