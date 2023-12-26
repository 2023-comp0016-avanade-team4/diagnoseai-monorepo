"""
Common database methods, including the estabishment of the DB session.

This is written in the context of functional apps, so the assumption
is that the caller will only need the session.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session


def create_session(
        server_url: str,
        database_name: str,
        username: str,
        password: str) -> Session:  # pragma: no cover
    """
    Creates a database session.

    Args:
        server_url (str): The server URL
        database_name (str): The database name
        username (str): The username
        password (str): The password

    Returns:
        Session: The database session
    """
    # This instantiates the session, and cannot be unit tested.
    engine = create_engine(
        f"mssql+pyodbc://{username}:{password}@{server_url}/{database_name}"
        f"?driver=ODBC+Driver+17+for+SQL+Server"
    )
    return sessionmaker(bind=engine)()
