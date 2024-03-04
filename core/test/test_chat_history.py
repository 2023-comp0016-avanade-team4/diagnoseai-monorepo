"""
Module to test the chat history endpoint
"""

import os
import unittest
from unittest.mock import patch

import azure.functions as func  # type: ignore[import-untyped]
from core.utils.history import ChatHistoryResponse
from core.models.chat_message import ChatMessageModel

# Globals patching
db_session_patch = patch('utils.db.create_session') \
    .start()

os.environ['DatabaseURL'] = ''
os.environ['DatabaseName'] = ''
os.environ['DatabaseUsername'] = ''
os.environ['DatabasePassword'] = ''

# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.chat_history.api import (get_history_from_db, main,  # noqa: E402
                                   handle_request_by_conversation_id)


class TestChatHistory(unittest.TestCase):
    """
    Tests the Chat History API
    """
    def setUp(self):
        """
        Set up the test
        """
        db_session_patch.start()
        self.verifyjwt_patch = patch('core.chat_history.api.verify_token') \
            .start()
        self.get_user_id_patch = patch('core.chat_history.api.get_user_id') \
            .start()
        self.authoriseuser_patch = patch(
            'core.chat_history.api.authorise_user').start()

        self.verifyjwt_patch.return_value = True
        self.get_user_id_patch.return_value = '123'
        self.authoriseuser_patch.return_value = True

    def tearDown(self):
        """
        Tear down the test
        """
        db_session_patch.stop()
        self.verifyjwt_patch.stop()
        self.get_user_id_patch.stop()
        self.authoriseuser_patch.stop()

    @patch('core.chat_history.api.handle_request_by_conversation_id')
    def test_main_happy(self, m):
        """
        Reads from the conversation ID parameter
        """
        mocked_output = ChatHistoryResponse.from_dict({
            'messages': [
                {
                    'message': 'hello',
                    'conversation_id': '123',
                    'sent_at': 1703629825,
                    'sender': 'bot'
                }
            ],
            'conversation_done': True
        })
        m.return_value = mocked_output
        expected_response = mocked_output.to_json()

        response = main(
            func.HttpRequest(
                'GET', "/api/chat/history",
                params={'conversation_id': '123'},
                headers={'auth-token': 'mock-token'},
                body=b''))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_body().decode(), expected_response)
        m.assert_called_once()
        self.assertEqual(m.call_args[0][0], '123')

    def test_main_sad_1(self):
        """
        If the conversation ID parameter doesn't exist, a bad request
        should be thrown
        """
        response = main(
            func.HttpRequest(
                'GET', '/api/chat/history',
                params={},
                body=b''
            )
        )
        self.assertEqual(response.status_code, 400)

    def test_get_history_from_db(self):
        """
        The get history from DB should call the
        get_all_messages_for_conversation method. It does not matter
        what arguments are passed to it; it just needs to call it.
        """
        with patch(
                'models.chat_message.ChatMessageDAO'
                '.get_all_messages_for_conversation'
        ) as m:
            # need to list it to consume the map
            list(get_history_from_db('123'))
            m.assert_called_once()

    @patch(
        'models.conversation_status.ConversationStatusDAO.'
        'is_conversation_completed', return_value=False)
    @patch(
        'models.chat_message.ChatMessageDAO.get_all_messages_for_conversation')
    def test_handle_request(self, m, csdao_mock):
        """
        Handling a request should eventually call the DAO to obtain
        messages
        """
        m.return_value = [ChatMessageModel(
            conversation_id='123',
            message='hello world',
            sent_at=123,
            sender='bot'
        )]
        response = handle_request_by_conversation_id('123')
        m.assert_called_once()
        csdao_mock.assert_called_once()
        self.assertEqual(response.messages[0].message, 'hello world')
        self.assertEqual(response.conversation_done, False)
