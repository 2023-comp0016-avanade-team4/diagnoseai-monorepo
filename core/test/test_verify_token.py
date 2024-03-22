"""
Tests the verify_token function in core.utils.verify_token
"""

from unittest.mock import patch

import jwt
from core.utils.verify_token import verify_token

from base_test_case import BaseTestCase


class TestVerifyToken(BaseTestCase):
    """
    Tests the verify_token function in core.utils.verify_token
    """
    @classmethod
    def setUpClass(cls):
        cls.secrets_and_services_mock('core.utils.verify_token',
                                      no_services=True)

    def setUp(self):
        # Generating token for testing
        self.payload = {
            'username': 'test',
            'password': 'test',
            'azp': 'test',
        }
        self.key = 'test'
        self.token = jwt.encode(self.payload, self.key, algorithm='HS256')
        env_mocks = {
            'ClerkPublicKey': self.key,
            'ClerkAZPList': 'test'
        }
        self.secrets_mock.get.side_effect = lambda x: env_mocks[x]

    @patch('jwt.decode', return_value={'azp': 'test'})
    @patch('jwt.get_unverified_header', return_value={'alg': 'HS256'})
    def test_verify_token_azp_in_list(self, jwt_guh_patch,
                                      jwt_decode_patch):
        """
        Tests that verify_token returns True when the azp is in the list
        """
        self.assertTrue(verify_token(self.token))
        jwt_guh_patch.assert_called_once_with(self.token)
        jwt_decode_patch.assert_called_once_with(self.token, key=self.key,
                                                 algorithms='HS256')

    @patch('jwt.decode', return_value={'azp': 'not_test'})
    @patch('jwt.get_unverified_header', return_value={'alg': 'HS256'})
    def test_verify_token_azp_not_in_list(self, jwt_guh_patch,
                                          jwt_decode_patch):
        """
        Tests that verify_token returns False when the azp is not in the list
        """
        self.assertEqual(verify_token(self.token), False)
        jwt_guh_patch.assert_called()
        jwt_decode_patch.assert_called_with(self.token, key=self.key,
                                            algorithms='HS256')

    @patch('jwt.decode', side_effect=Exception)
    @patch('jwt.get_unverified_header', return_value={'alg': 'HS256'})
    def test_verify_token_invalid_token(self, jwt_guh_patch,
                                        jwt_decode_patch):
        """
        Tests that verify_token returns False when the token is invalid
        """
        self.assertEqual(verify_token(self.token), False)
        jwt_guh_patch.assert_called()
        jwt_decode_patch.assert_called_with(self.token, key=self.key,
                                            algorithms='HS256')
