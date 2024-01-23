import os 

import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.environ['CLERK_SECRET_KEY']

azp_list = os.environ['CLERK_AZP_LIST'].split(',')

def verify_token(token):
    try:
        headers = jwt.get_unverified_header(token)
        decoded = jwt.decode(token, key = SECRET_KEY,  algorithms = headers['alg']) # Automatically checks for expiration
        print(decoded, azp_list)
        if decoded['azp'] in azp_list:
            return True
        else:
            return False
    except:
        return False

