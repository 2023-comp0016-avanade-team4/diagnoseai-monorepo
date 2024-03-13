import os

import jwt
import logging
from datetime import datetime, timedelta

PUBLIC_KEY = os.environ['CLERK_PUBLIC_KEY']

azp_list = os.environ['CLERK_AZP_LIST'].split(',')

def verify_token(token):
    """Verify a token is valid, from the right source and has not expired."""
    try:
        headers = jwt.get_unverified_header(token)
        # Note: jwt.decode automatically checks for expiration
        decoded = jwt.decode(token, key=PUBLIC_KEY, algorithms=headers['alg'])
        return decoded['azp'] in azp_list
    except jwt.exceptions.ExpiredSignatureError:
        logging.error("Token has expired")
        return False
    except jwt.exceptions.InvalidTokenError:
        logging.error("Token is invalid")
        return False
    except Exception as e:
        logging.error('Other Exception occured', e)
        return False
