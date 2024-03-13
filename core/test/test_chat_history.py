"""
Module to test the chat history endpoint
"""

import os
import unittest
from unittest.mock import patch
from base_test_case import BaseTestCase

import azure.functions as func  # type: ignore[import-untyped]
from core.utils.history import ChatHistoryResponse
from core.models.chat_message import ChatMessageModel

# Globals patching
db_session_patch = patch('utils.db.create_session') \
    .start()
bsc_patch = patch('azure.storage.blob.BlobServiceClient.from_connection_string') \
    .start()

os.environ['DatabaseURL'] = ''
os.environ['DatabaseName'] = ''
os.environ['DatabaseUsername'] = ''
os.environ['DatabasePassword'] = ''
os.environ['ImageBlobConnectionString'] = ''
os.environ['ImageBlobContainer'] = ''

# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.functions.chat_history import (get_history_from_db, main,  # noqa: E402
                                         handle_request_by_conversation_id)


class TestChatHistory(BaseTestCase):
    """
    Tests the Chat History API
    """

    @staticmethod
    def setUpClass():
        # Token verification mock. This is torn down in tearDownClass
        patch('core.functions.chat_history.verify_token').start()
        patch('core.functions.chat_history.authorise_user').start()

    def test_main_happy(self):
        """
        Reads from the conversation ID parameter
        """
        with patch(
                'core.functions.chat_history.handle_request_by_conversation_id'
        ) as m:
            mocked_output = ChatHistoryResponse.from_dict({
                'messages': [
                    {
                        'message': 'hello',
                        'conversation_id': '123',
                        'sent_at': 1703629825,
                        'sender': 'bot'
                    }
                ]
            })
            m.return_value = mocked_output
            expected_response = mocked_output.to_json()

            response = main(
                func.HttpRequest(
                    'GET', "/api/chat/history",
                    params={'conversation_id': '123'},
                    headers={'Auth-Token': 'test_token'},
                    body=b''))

            m.assert_called_once()
            self.assertEqual(m.call_args[0][0], '123')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_body().decode(), expected_response)

    def test_main_sad_1(self):
        """
        If the conversation ID parameter doesn't exist, a bad request
        should be thrown
        """
        response = main(
            func.HttpRequest(
                'GET', '/api/chat/history',
                params={},
                headers={'Auth-Token': 'test_token'},
                body=b''
            )
        )
        self.assertEqual(response.status_code, 400)

    def test_get_history_from_db_no_images(self):
        """
        The get history from DB should call the
        get_all_messages_for_conversation method. It does not matter
        what arguments are passed to it; it just needs to call it.
        """
        with patch(
                'models.chat_message.ChatMessageDAO'
                '.get_all_messages_for_conversation'
        ) as m, patch(
            'core.utils.image_utils.get_preauthenticated_blob_url'
        ) as n:
            # need to list it to consume the map
            list(get_history_from_db('123'))
            m.assert_called_once()
            n.assert_not_called()

    def test_get_history_from_db_image(self):
        """
        The get history from DB should call the
        get_all_messages_for_conversation method. It does not matter
        what arguments are passed to it; it just needs to call it.

        This time, it should also call get_preauthenticated_blob_url
        """
        with patch(
                'models.chat_message.ChatMessageDAO'
                '.get_all_messages_for_conversation'
        ) as m, patch(
            'core.functions.chat_history.get_preauthenticated_blob_url'
        ) as n:
            m.return_value = [ChatMessageModel(
                conversation_id='123',
                message='hello world',
                sent_at=123,
                sender='bot',
                citations=[],
                is_image=True
            )]
            # need to list it to consume the map
            list(get_history_from_db('123'))
            m.assert_called_once()
            n.assert_called_once()

    def test_handle_request(self):
        """
        Handling a request should eventually call the DAO to obtain
        messages
        """
        with patch(
                'models.chat_message.ChatMessageDAO'
                '.get_all_messages_for_conversation'
        ) as m:
            m.return_value = [ChatMessageModel(
                conversation_id='123',
                message='hello world',
                sent_at=123,
                citations=[],
                sender='bot',
                is_image=False
            )]
            response = handle_request_by_conversation_id('123')
            m.assert_called_once()
            self.assertEqual(response.messages[0].message, 'hello world')
