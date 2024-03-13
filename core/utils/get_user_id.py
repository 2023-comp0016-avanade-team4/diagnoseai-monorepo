import os
import jwt

PUBLIC_KEY = os.environ['CLERK_PUBLIC_KEY']


def get_user_id(token):
    """Get the user_id from a valid token."""
    try:
        headers = jwt.get_unverified_header(token)
        # Note: jwt.decode automatically checks for expiration
        decoded = jwt.decode(token, key=PUBLIC_KEY, algorithms=headers['alg'])
        return decoded["sub"]
    except jwt.exceptions.InvalidTokenError:
        return None
    except:
        return None
