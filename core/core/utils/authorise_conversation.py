"""
Util to authorise a user. user_id from database (owner of conversation)
needs to match current user_id passed as an argument.
"""
from sqlalchemy.orm import Session
from models.work_order import WorkOrderDAO as dao


def authorise_user(
    db_session: Session,
    conversation_id: str,
    curr_user: str
) -> bool:
    """
    Authorizes a user based on the provided conversation ID.

    Args:
        db_session: The database session object.
        conversation_id: The ID of the conversation.
        curr_user: The current user.

    Returns:
        True if the user is authorized, False otherwise.
    """
    owner = dao.get_user_id_for_conversation_id(db_session, conversation_id)

    if not owner or not curr_user:
        return False

    return owner == curr_user
