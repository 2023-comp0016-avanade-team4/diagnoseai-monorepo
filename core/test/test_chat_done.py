"""
Module to test the chat being done
"""

import os
import unittest
from unittest.mock import patch
from base_test_case import BaseTestCase

import azure.functions as func

# Globals patching
aoie_patch = patch('langchain_openai.AzureOpenAIEmbeddings') \
    .start()
as_patch = patch('langchain_community.vectorstores.azuresearch.AzureSearch') \
    .start()
db_session_patch = patch('utils.db.create_session') \
    .start()

os.environ['OpenAIKey'] = ''
os.environ['OpenAIEndpoint'] = ''
os.environ['SummarizationModel'] = ''
os.environ['CLERK_PUBLIC_KEY'] = 'test'
os.environ['CLERK_AZP_LIST'] = 'test'
os.environ['SummarySearchKey'] = ''
os.environ['SummarySearchEndpoint'] = ''

# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.functions.chat_done import main, summarize_and_store  # noqa: E402


class TestChatDone(BaseTestCase):
    """
    Tests the Chat Done API
    """
    # pylint: disable=too-many-arguments
    def setUp(self):
        self.request = func.HttpRequest(
            method='POST',
            url='/api/chat_done',
            params={'conversation_id': '123', 'done': 'true'},
            body='',
            headers={'Auth-Token': '123'}
        )

    @patch('core.functions.chat_done.summarize_and_store')
    @patch('core.functions.chat_done.authorise_user', return_value=True)
    @patch('core.functions.chat_done.ConversationStatusDAO')
    @patch('core.functions.chat_done.verify_token', return_value=True)
    @patch('core.functions.chat_done.get_user_id', return_value='123')
    def test_main_happy(self, gui_mock, vjwt_mock, csdao_mock, authorise_mock,
                        sas_mock):
        """Parses the expected ChatMessage from input"""
        main(self.request)

        sas_mock.assert_called_once()
        authorise_mock.assert_called_once()
        csdao_mock.mark_conversation_completed.assert_called_once()
        csdao_mock.mark_conversation_not_completed.assert_not_called()
        vjwt_mock.assert_called_once()
        gui_mock.assert_called_once()

    @patch('core.functions.chat_done.summarize_and_store')
    @patch('core.functions.chat_done.authorise_user', return_value=True)
    @patch('core.functions.chat_done.ConversationStatusDAO')
    @patch('core.functions.chat_done.verify_token', return_value=True)
    @patch('core.functions.chat_done.get_user_id', return_value='123')
    def test_main_happy_undone(self, gui_mock, vjwt_mock, csdao_mock,
                               authorise_mock, sas_mock):
        """Parses the expected ChatMessage from input"""
        main(func.HttpRequest(
            method='POST',
            url='/api/chat_done',
            params={'conversation_id': '123', 'done': 'false'},
            body='',
            headers={'Auth-Token': '123'}
        ))

        sas_mock.assert_called_once()
        authorise_mock.assert_called_once()
        csdao_mock.mark_conversation_completed.assert_not_called()
        csdao_mock.mark_conversation_not_completed.assert_called_once()
        vjwt_mock.assert_called_once()
        gui_mock.assert_called_once()

    @patch('core.functions.chat_done.summarize_and_store')
    @patch('core.functions.chat_done.authorise_user', return_value=True)
    @patch('core.functions.chat_done.ConversationStatusDAO')
    @patch('core.functions.chat_done.verify_token', return_value=False)
    @patch('core.functions.chat_done.get_user_id', return_value='123')
    def test_main_unauthorized(self, gui_mock, vjwt_mock, csdao_mock,
                               authorise_mock, sas_mock):
        """Parses the expected ChatMessage from input"""
        response = main(self.request)

        self.assertEqual(response.status_code, 401)
        sas_mock.assert_not_called()
        authorise_mock.assert_not_called()
        csdao_mock.mark_conversation_completed.assert_not_called()
        csdao_mock.mark_conversation_not_completed.assert_not_called()
        vjwt_mock.assert_called_once()
        gui_mock.assert_not_called()

    @patch('core.functions.chat_done.summarize_and_store')
    @patch('core.functions.chat_done.authorise_user', return_value=False)
    @patch('core.functions.chat_done.ConversationStatusDAO')
    @patch('core.functions.chat_done.verify_token', return_value=True)
    @patch('core.functions.chat_done.get_user_id', return_value='123')
    def test_main_no_conversation_id(self, gui_mock, vjwt_mock, csdao_mock,
                                     authorise_mock, sas_mock):
        """Parses the expected ChatMessage from input"""
        response = main(func.HttpRequest(
            method='POST',
            url='/api/chat_done',
            body='',
            headers={'Auth-Token': '123'}
        ))

        self.assertEqual(response.status_code, 400)
        sas_mock.assert_not_called()
        authorise_mock.assert_not_called()
        csdao_mock.mark_conversation_completed.assert_not_called()
        vjwt_mock.assert_called_once()
        gui_mock.assert_not_called()

    @patch('core.functions.chat_done.summarize_and_store')
    @patch('core.functions.chat_done.authorise_user', return_value=False)
    @patch('core.functions.chat_done.ConversationStatusDAO')
    @patch('core.functions.chat_done.verify_token', return_value=True)
    @patch('core.functions.chat_done.get_user_id', return_value='123')
    def test_main_no_done(self, gui_mock, vjwt_mock, csdao_mock,
                          authorise_mock, sas_mock):
        """Parses the expected ChatMessage from input"""
        response = main(func.HttpRequest(
            method='POST',
            url='/api/chat_done',
            params={'conversation_id': '123'},
            body='',
            headers={'Auth-Token': '123'}
        ))

        self.assertEqual(response.status_code, 400)
        sas_mock.assert_not_called()
        authorise_mock.assert_not_called()
        csdao_mock.mark_conversation_completed.assert_not_called()
        csdao_mock.mark_conversation_not_completed.assert_not_called()
        vjwt_mock.assert_called_once()
        gui_mock.assert_not_called()

    @patch('core.functions.chat_done.__summarize_conversation',
           return_value='summary')
    @patch('core.functions.chat_done.__store_into_index')
    def test_summarize_and_store(self, sii_mock, sc_mock):
        """Parses the expected ChatMessage from input"""
        summarize_and_store('123', '456')

        sc_mock.assert_called_once()
        sii_mock.assert_called_once()
