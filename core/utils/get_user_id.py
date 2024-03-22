"""
TODO: Refactor into verify_token.py
This module provides a function to extract the user_id from a valid token.
"""

import logging
from typing import Optional

import jwt

from utils.secrets import Secrets


def get_user_id(token) -> Optional[str]:
    """Get the user_id from a valid token."""
    public_key = Secrets.get('ClerkPublicKey')
    try:
        headers = jwt.get_unverified_header(token)
        # Note: jwt.decode automatically checks for expiration
        decoded = jwt.decode(token, key=public_key, algorithms=headers['alg'])
        return decoded["sub"]
    except jwt.exceptions.InvalidTokenError:
        logging.error("Token is invalid")
        return None
    except:  # pylint: disable=bare-except # noqa: E722
        logging.error("Other Exception occured")
        return None
