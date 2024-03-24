"""
Utilities to perform hashing.

Contrary to the package name, this essentially hides away the
implementation of hashing for certain use cases (e.g. deriving the
user search index from the username)
"""

import hashlib


def get_search_index_for_user_id(user_id: str) -> str:
    """
    Gets an Azure Search Index friendly string given the user ID.

    Args:
        user_id (str): The user ID

    Returns:
        str: The search index
    """
    hashable = hashlib.sha256(user_id.encode())
    return f'user-{hashable.hexdigest()}'
