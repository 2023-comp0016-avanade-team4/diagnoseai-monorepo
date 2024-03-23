"""
Chat History integration testing.

A chat is saved into the database, and can be pulled out by a
subsequent call to history.

This test is meant to be run on the docker compose.
"""

from unittest.mock import create_autospec

from azure.functions import HttpRequest
from core.utils.chat_message import ChatMessage
from core.utils.web_pub_sub_interfaces import WebPubSubRequest
from openai.types.chat.chat_completion import (ChatCompletion,
                                               ChatCompletionMessage, Choice)

from base_int_test import BaseIntegrationTest


class TestChatHistory(BaseIntegrationTest):
    """
    Figures out if Chat History works.
    """
    def setUp(self):
        super().setUp()

        # Mock the openai_client to always reply something.
        # Doesn't need to be coherent
        chat_completion = create_autospec(ChatCompletion)
        chat_completion_message = create_autospec(ChatCompletionMessage)
        choice = create_autospec(Choice)
        type(chat_completion_message).content = 'reply!'
        type(chat_completion_message).role = 'bot'
        type(chat_completion_message).context = {'citations': []}
        choice.message = chat_completion_message
        type(chat_completion).choices = [choice]
        self.services.return_value.openai_chat_model.chat.completions.\
            create.return_value = chat_completion

    def test_chat_history(self):
        """
        Tests the Chat History API
        """
        # Importing here to force mocks to override globally
        # pylint: disable=import-outside-toplevel
        from core.functions.chat import main as chat_main
        from core.functions.chat_history import main as chat_history_main

        conversation_status, machine, work_order = self.generate_fixtures()
        self.commit_fixtures(self.session, conversation_status, machine,
                             work_order)

        chat_message = ChatMessage(
            conversation_id='123',
            auth_token=self.token,
            is_image=False,
            message='test message',
            sent_at=1711144789,
        )

        request = WebPubSubRequest(
            data=chat_message.to_json(),
            connection_context={'connectionId': '123'},
        )

        chat_main(request.to_json())

        request = HttpRequest(
            method='GET',
            url='/api/history',
            params={'conversation_id': '123'},
            headers={'Auth-Token': self.token},
            body=''
        )
        response = chat_history_main(request)
        self.assertEqual(response.status_code, 200)

        body = response.get_body()
        self.assertIn(b'test message', body)
        self.assertIn(b'reply!', body)

    def test_empty_chat_history(self):
        # Importing here to force mocks to override globally
        # pylint: disable=import-outside-toplevel
        from core.functions.chat_history import main as chat_history_main

        request = HttpRequest(
            method='GET',
            url='/api/history',
            params={'conversation_id': '123'},
            headers={'Auth-Token': self.token},
            body=''
        )
        response = chat_history_main(request)
        self.assertEqual(response.status_code, 200)

        body = response.get_body()
        self.assertIn(b'[]', body)

    def test_unauthorized_chat_history_access(self):
        """
        Tests that a user can't access another user's Chat History
        """
        # Importing here to force mocks to override globally
        # pylint: disable=import-outside-toplevel
        from core.functions.chat import main as chat_main

        conversation_status, machine, work_order = self.generate_fixtures()
        work_order.user_id = 'another_user'
        self.commit_fixtures(self.session, conversation_status, machine,
                             work_order)

        chat_message = ChatMessage(
            conversation_id='123',
            auth_token=self.create_token_for_user('another_user'),
            is_image=False,
            message='test message',
            sent_at=1711144789,
        )

        request = WebPubSubRequest(
            data=chat_message.to_json(),
            connection_context={'connectionId': '123'},
        )

        chat_main(request.to_json())

        request = HttpRequest(
            method='GET',
            url='/api/history',
            params={'conversation_id': '123'},
            headers={'Auth-Token': self.token},
            body=''
        )

        self.assertNotIn('test message', request.get_body())
