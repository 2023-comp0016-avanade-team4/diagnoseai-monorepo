"""
Module to test chat connection
"""
import os
import unittest
from unittest.mock import create_autospec, patch

from azure.functions import HttpRequest


#patching the verify_token function

vjwt_patch = patch('utils.verify_token.verify_token')
mock_vjwt = vjwt_patch.start()
mock_vjwt.return_value = True

# Globals patching

service_patch = \
    patch('azure.messaging.webpubsubservice.WebPubSubServiceClient') \
    .start()

os.environ['WebPubSubConnectionString'] = ''
os.environ['WebPubSubHubName'] = ''
os.environ['CLERK_SECRET_KEY'] = 'test'
os.environ['CLERK_AZP_LIST'] = 'test'

# pylint: disable=wrong-import-position
from core.chat_connection.api import (generate_wss_url,  # noqa: E402, E501
                                      main, service)
from core.utils.conversation import ChatConnectionRequest  # noqa: E402, E501


class TestChatConnection(unittest.TestCase):
    """
    Tests the Chat Connection REST API
    """
    def test_main_happy(self):
        """Parses the expected Chat Connection"""
        req = create_autospec(HttpRequest)
        req.get_body.return_value = ChatConnectionRequest(
            user_id='123'
        ).to_json()

        with patch('core.chat_connection.api.generate_wss_url') as fn:
            main(req)
            fn.assert_called_once()
            self.assertEqual(fn.call_args[0][0].user_id, '123')

    def test_generate_wss_url(self):
        """Expects the function to call the service"""
        make_convo_request = ChatConnectionRequest(
            user_id='123'
        )

        service.get_client_access_token.return_value = {'url': 'something'}
        self.assertEqual(generate_wss_url(make_convo_request), 'something')
        service.get_client_access_token.assert_called_once()
