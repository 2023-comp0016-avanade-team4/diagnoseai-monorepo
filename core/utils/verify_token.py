import os

import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.environ['CLERK_SECRET_KEY']

azp_list = os.environ['CLERK_AZP_LIST'].split(',')

def verify_token(token):
    """Verify a token is valid, from the right source and has not expired."""
    try:
        headers = jwt.get_unverified_header(token)
        # Note: jwt.decode automatically checks for expiration
        decoded = jwt.decode(token, key = SECRET_KEY,  algorithms = headers['alg'])
        if decoded['azp'] in azp_list:
            return True
        else:
            return False
    except:
        return False
