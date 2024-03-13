"""
Tests the verify_token function in core.utils.verify_token

"""


import os
import unittest
from unittest.mock import patch
from base_test_case import BaseTestCase

import jwt

# Generating token for testing
payload = {
    'username': 'test',
    'password': 'test',
    'azp': 'test',
        }
KEY = 'test'
TOKEN = jwt.encode(payload, KEY, algorithm='HS256')

# Environment patching
os.environ['CLERK_PUBLIC_KEY'] = KEY
os.environ['CLERK_AZP_LIST'] = 'test'

from core.utils.verify_token import verify_token

class TestVerifyToken(BaseTestCase):
    """
    Tests the verify_token function in core.utils.verify_token
    """
    @patch('jwt.decode', return_value={'azp': 'test'})
    @patch('jwt.get_unverified_header', return_value={'alg': 'HS256'})
    def test_verify_token_azp_in_list(self, jwt_guh_patch,
                                      jwt_decode_patch):
        """
        Tests that verify_token returns True when the azp is in the list
        """
        self.assertTrue(verify_token(TOKEN))
        jwt_guh_patch.assert_called_once_with(TOKEN)
        jwt_decode_patch.assert_called_once_with(TOKEN, key=KEY,
                                                 algorithms='HS256')

    @patch('jwt.decode', return_value={'azp': 'not_test'})
    @patch('jwt.get_unverified_header', return_value={'alg': 'HS256'})
    def test_verify_token_azp_not_in_list(self, jwt_guh_patch,
                                          jwt_decode_patch):
        """
        Tests that verify_token returns False when the azp is not in the list
        """
        self.assertEqual(verify_token(TOKEN), False)
        jwt_guh_patch.assert_called()
        jwt_decode_patch.assert_called_with(TOKEN, key=KEY, algorithms='HS256')

    @patch('jwt.decode', side_effect=Exception)
    @patch('jwt.get_unverified_header', return_value={'alg': 'HS256'})
    def test_verify_token_invalid_token(self, jwt_guh_patch,
                                        jwt_decode_patch):
        """
        Tests that verify_token returns False when the token is invalid
        """
        self.assertEqual(verify_token(TOKEN), False)
        jwt_guh_patch.assert_called()
        jwt_decode_patch.assert_called_with(TOKEN, key=KEY, algorithms='HS256')
