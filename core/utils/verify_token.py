"""
Verifies a JWT token.
"""

import logging
import jwt
from utils.secrets import Secrets


def verify_token(token):
    """Verify a token is valid, from the right source and has not expired."""
    public_key = Secrets.get('ClerkPublicKey')
    azp_list = Secrets.get('ClerkAZPList').split(',')

    try:
        headers = jwt.get_unverified_header(token)
        # Note: jwt.decode automatically checks for expiration
        decoded = jwt.decode(token, key=public_key, algorithms=headers['alg'])
        return decoded['azp'] in azp_list
    except jwt.exceptions.ExpiredSignatureError:
        logging.error("Token has expired")
        return False
    except jwt.exceptions.InvalidTokenError:
        logging.error("Token is invalid")
        return False
    except Exception:  # pylint: disable=broad-except
        logging.error('Other Exception occured')
        return False
