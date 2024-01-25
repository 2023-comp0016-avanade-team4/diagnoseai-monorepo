"""
Tests the verify_token function in core.utils.verify_token

"""


import os
import unittest
from unittest.mock import patch

import jwt

from core.utils.verify_token import verify_token

#Generating token for testing
payload = {
    'username': 'test',
    'password': 'test',
    'azp': 'test',
        }
KEY = 'test'
TOKEN = jwt.encode(payload, KEY, algorithm='HS256')

#globals patching for testing

jwt_guh_patch = patch('jwt.get_unverified_header').start()
jwt_guh_patch.return_value = {'alg': 'HS256'}
jwt_decode_patch = patch('jwt.decode').start()

#Environment patching
os.environ['CLERK_SECRET_KEY'] = KEY
os.environ['CLERK_AZP_LIST'] = 'test'



class TestVerifyToken(unittest.TestCase):
    """
    Tests the verify_token function in core.utils.verify_token
    """
    def test_verify_token_azp_in_list(self):
        """
        Tests that verify_token returns True when the azp is in the list
        """
        jwt_decode_patch.return_value = {'azp': 'test'}
        self.assertTrue(verify_token(TOKEN))
        jwt_guh_patch.assert_called_once_with(TOKEN)
        jwt_decode_patch.assert_called_once_with(TOKEN, key = KEY, algorithms='HS256')


    def test_verify_token_azp_not_in_list(self):
        """
        Tests that verify_token returns False when the azp is not in the list
        """
        jwt_decode_patch.return_value = {'azp': 'not_test'}
        self.assertEqual(verify_token(TOKEN), False)
        jwt_guh_patch.assert_called()
        jwt_decode_patch.assert_called_with(TOKEN, key = KEY, algorithms='HS256')

    def test_verify_token_invalid_token(self):
        """
        Tests that verify_token returns False when the token is invalid
        """
        jwt_decode_patch.side_effect = Exception
        self.assertEqual(verify_token(TOKEN), False)
        jwt_guh_patch.assert_called()
        jwt_decode_patch.assert_called_with(TOKEN, key = KEY, algorithms='HS256')
