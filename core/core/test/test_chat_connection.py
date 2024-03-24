"""
Module to test chat connection
"""
from unittest.mock import create_autospec, patch

from azure.functions import HttpRequest
from core.functions.chat_connection import generate_wss_url
from core.functions.chat_connection import main
from core.utils.conversation import ChatConnectionRequest

from base_test_case import BaseTestCase


class TestChatConnection(BaseTestCase):
    """
    Tests the Chat Connection REST API
    """
    @classmethod
    def setUpClass(cls):
        cls.secrets_and_services_mock('core.functions.chat_connection',
                                      no_secret=True)

    def test_main_happy(self):
        """Parses the expected Chat Connection"""
        req = create_autospec(HttpRequest)
        req.get_body.return_value = ChatConnectionRequest(
            user_id='123'
        ).to_json()

        with patch('core.functions.chat_connection.generate_wss_url') as fn:
            main(req)
            fn.assert_called_once()
            self.assertEqual(fn.call_args[0][0].user_id, '123')

    def test_main_sad(self):
        """Invalid JSON should return a 500"""
        req = create_autospec(HttpRequest)
        req.get_body.return_value = 'not json'

        with patch('core.functions.chat_connection.generate_wss_url') as fn:
            response = main(req)
            fn.assert_not_called()
            self.assertEqual(response.status_code, 500)

    def test_generate_wss_url(self):
        """Expects the function to call the service"""
        make_convo_request = ChatConnectionRequest(
            user_id='123'
        )

        self.services_mock.return_value.\
            webpubsub.get_client_access_token \
                     .return_value = {'url': 'something'}
        self.assertEqual(generate_wss_url(make_convo_request), 'something')
        self.services_mock.return_value.webpubsub.get_client_access_token. \
            assert_called_once()
