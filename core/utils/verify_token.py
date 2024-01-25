import os

import jwt
from datetime import datetime, timedelta

PUBLIC_KEY = os.environ['CLERK_PUBLIC_KEY']

azp_list = os.environ['CLERK_AZP_LIST'].split(',')

def verify_token(token):
    """Verify a token is valid, from the right source and has not expired."""
    try:
        headers = jwt.get_unverified_header(token)
        # Note: jwt.decode automatically checks for expiration
        decoded = jwt.decode(token, key = PUBLIC_KEY,  algorithms = headers['alg'])
        return decoded['azp'] in azp_list
    except jwt.exceptions.ExpiredSignatureError:
        print("Token has expired")
        return False
    except jwt.exceptions.InvalidTokenError:
        print("Token is invalid")
        return False
    except:
        print("Unknown error")
        return False
