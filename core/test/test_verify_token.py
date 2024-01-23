import os
import unittest
from unittest.mock import Mock, MagicMock, patch

import jwt 


#Generating token for testing
payload = {
    'username': 'test',
    'password': 'test',
    'azp': 'test',
        }
key = 'test'
token = jwt.encode(payload, key, algorithm='HS256')

#globals patching for testing

jwt_guh_patch = patch('jwt.get_unverified_header').start()
jwt_guh_patch.return_value = {'alg': 'HS256'}
jwt_decode_patch = patch('jwt.decode').start()

#Environment patching
os.environ['CLERK_SECRET_KEY'] = key
os.environ['CLERK_AZP_LIST'] = 'test'


from core.utils.verify_token import verify_token

class TestVerifyToken(unittest.TestCase):
    def test_verify_token_azp_in_list(self):
        jwt_decode_patch.return_value = {'azp': 'test'}
        self.assertTrue(verify_token(token))
        jwt_guh_patch.assert_called_once_with(token)
        jwt_decode_patch.assert_called_once_with(token, key = key, algorithms='HS256')


    def test_verify_token_azp_not_in_list(self):
        jwt_decode_patch.return_value = {'azp': 'not_test'}
        self.assertEqual(verify_token(token), False)
        jwt_guh_patch.assert_called()
        jwt_decode_patch.assert_called_with(token, key = key, algorithms='HS256')

    def test_verify_token_invalid_token(self):
        jwt_decode_patch.side_effect = Exception
        self.assertEqual(verify_token(token), False)
        jwt_guh_patch.assert_called()
        jwt_decode_patch.assert_called_with(token, key = key, algorithms='HS256')


    



