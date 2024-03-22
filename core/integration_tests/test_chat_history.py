"""
Chat History integration testing.

A chat is saved into the database, and can be pulled out by a
subsequent call to history.

This test is meant to be run on the docker compose.
"""

import unittest
from unittest.mock import create_autospec, patch

import jwt
from azure.functions import HttpRequest
from core.utils.chat_message import ChatMessage
from core.utils.db import create_session
from core.utils.web_pub_sub_interfaces import WebPubSubRequest
from openai.types.chat.chat_completion import (ChatCompletion,
                                               ChatCompletionMessage, Choice)


class TestChatHistory(unittest.TestCase):
    """
    Figures out if Chat History works.
    """
    def setUp(self):
        self.services = patch('utils.services.Services').start()
        self.secrets = patch('utils.secrets.Secrets').start()

        # Mock the JWT to prepare for requests
        mocked_secrets = {
            'ClerkPublicKey': 'test',
            'ClerkAZPList': 'localhost'
        }
        self.secrets.return_value.get.side_effect = mocked_secrets.get
        self.payload = {
            'sub': 'test',
            'azp': 'localhost',
        }
        self.token = jwt.encode(self.payload, 'test', algorithm='HS256')

        # DB is about the only thing we can really connect
        self.session = create_session(
            'db',
            'testdb',
            'SA',
            'password123!',
            True
        )
        self.services.return_value.db_session = self.session

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
        from core.models.conversation_status import (
            ConversationCompletedStatus, ConversationStatusModel)
        from core.models.work_order import MachineModel, WorkOrderModel

        # create a machine, then a work model, then add it to db
        machine = MachineModel(
            manufacturer='test',
            model='test'
        )

        conversation_status = ConversationStatusModel(
            conversation_id='123',
            status=ConversationCompletedStatus.NOT_COMPLETED
        )

        work_order = WorkOrderModel(
            machine=machine,
            conversation=conversation_status,
            user_id='test',
            conversation_id='123',
            task_name='something',
            task_desc='something'
        )

        self.session.add(machine)
        self.session.add(conversation_status)
        self.session.add(work_order)
        self.session.commit()
        self.session.flush()

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
