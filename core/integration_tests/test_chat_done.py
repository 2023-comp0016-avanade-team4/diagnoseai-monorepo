"""
Chat Done Endpoint integration testing.

Chat status is updated in the database, and can be verified by a
subsequent call to work_orders.

This test is meant to be run on the docker compose.
"""

from unittest.mock import patch

from azure.functions import HttpRequest
from core.models.conversation_status import ConversationCompletedStatus

from base_int_test import BaseIntegrationTest


class TestChatDone(BaseIntegrationTest):
    """
    Figures out if Chat Done Endpoint works.
    """
    def setUp(self):
        super().setUp()

        patch('langchain_community.vectorstores.azuresearch.AzureSearch') \
            .start()
        self.reload_modules()

    def test_chat_marked_done(self):
        """
        Tests if a conversation is marked as done
        """
        # Importing here to force mocks to override globally
        # pylint: disable=import-outside-toplevel
        from core.functions.chat_done import main as chat_done_main
        from core.functions.work_order import main as work_order_main

        conversation_status, machine, work_order = self.generate_fixtures()
        self.commit_fixtures(self.session, conversation_status, machine,
                             work_order)

        request = HttpRequest(
            method='POST',
            url='/api/chat_done',
            params={'conversation_id': '123', 'done': 'true'},
            headers={'Auth-Token': self.token},
            body=''
        )
        response = chat_done_main(request)
        self.assertEqual(response.status_code, 200)

        # verify by hitting work_orders endpoint
        request = HttpRequest(
            method='GET',
            url='/api/work_order',
            params={'user_id': 'test'},
            headers={'Auth-Token': self.token},
            body=''
        )
        response = work_order_main(request)
        self.assertEqual(response.status_code, 200)
        body = response.get_body()
        self.assertIn(b'COMPLETED', body)

    def test_chat_not_marked_done(self):
        """
        Tests if a conversation not marked as done is returned as NOT_COMPLETED
        """
        # Importing here to force mocks to override globally
        # pylint: disable=import-outside-toplevel
        from core.functions.work_order import main as work_order_main

        conversation_status, machine, work_order = self.generate_fixtures()
        self.commit_fixtures(self.session, conversation_status, machine,
                             work_order)

        # verify by hitting work_orders endpoint
        request = HttpRequest(
            method='GET',
            url='/api/work_order',
            headers={'Auth-Token': self.token},
            params={'user_id': 'test'},
            body=''
        )
        response = work_order_main(request)
        self.assertEqual(response.status_code, 200)
        body = response.get_body()
        self.assertIn(b'NOT_COMPLETED', body)

    def test_chat_marked_undone(self):
        """
        Tests if a conversation is marked as done
        """
        # Importing here to force mocks to override globally
        # pylint: disable=import-outside-toplevel
        from core.functions.chat_done import main as chat_done_main
        from core.functions.work_order import main as work_order_main

        conversation_status, machine, work_order = self.generate_fixtures()
        conversation_status.status = ConversationCompletedStatus.COMPLETED
        self.commit_fixtures(self.session, conversation_status, machine,
                             work_order)

        request = HttpRequest(
            method='POST',
            url='/api/chat_done',
            params={'conversation_id': '123', 'done': 'false'},
            headers={'Auth-Token': self.token},
            body=''
        )
        response = chat_done_main(request)
        self.assertEqual(response.status_code, 200)

        # verify by hitting work_orders endpoint
        request = HttpRequest(
            method='GET',
            url='/api/work_order',
            headers={'Auth-Token': self.token},
            params={'user_id': 'test'},
            body=''
        )
        response = work_order_main(request)
        self.assertEqual(response.status_code, 200)
        body = response.get_body()
        self.assertIn(b'NOT_COMPLETED', body)
