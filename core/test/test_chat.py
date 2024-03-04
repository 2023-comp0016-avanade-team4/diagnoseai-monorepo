"""
Module to test the chat endpoint
"""

import os
import unittest
from datetime import datetime
from typing import Optional, Tuple
from unittest.mock import MagicMock, PropertyMock, create_autospec, patch

from openai.types.chat.chat_completion import (ChatCompletion,
                                               ChatCompletionMessage, Choice)

# Globals patching
aoi_patch = patch('openai.AzureOpenAI') \
    .start()
db_session_patch = patch('utils.db.create_session') \
    .start()
sic_patch = patch('azure.search.documents.indexes.SearchIndexClient') \
    .start()

os.environ['WebPubSubConnectionString'] = ''
os.environ['WebPubSubHubName'] = ''
os.environ['OpenAIKey'] = ''
os.environ['OpenAIEndpoint'] = ''
os.environ['CLERK_PUBLIC_KEY'] = 'test'
os.environ['CLERK_AZP_LIST'] = 'test'
os.environ['CognitiveSearchKey'] = ''
os.environ['CognitiveSearchEndpoint'] = ''
os.environ['SummarySearchKey'] = ''
os.environ['SummarySearchEndpoint'] = ''
os.environ['DatabaseURL'] = ''
os.environ['DatabaseName'] = ''
os.environ['DatabaseUsername'] = ''
os.environ['DatabasePassword'] = ''


# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.Chat.chat import (ai_client, main, process_message,  # noqa: E402
                            ws_log_and_send_error, ws_send_message,
                            shadow_msg_to_db, strip_all_citations)
from core.utils.chat_message import ChatMessage  # noqa: E402
from core.utils.web_pub_sub_interfaces import WebPubSubConnectionContext  # pylint: disable=line-too-long # noqa: E402, E501
from core.utils.web_pub_sub_interfaces import WebPubSubRequest  # pylint: disable= line-too-long wrong-import-position # noqa: E402, E501


class TestChat(unittest.TestCase):
    """
    Tests the Chat WebSocket API
    """
    def setUp(self):
        self.verifyjwt_mock = patch('core.Chat.chat.verify_token',
                                    return_value=True).start()
        self.get_user_id_mock = patch('core.Chat.chat.get_user_id',
                                      return_value='123').start()
        self.authorize_mock = patch('core.Chat.chat.authorise_user',
                                    return_value=True).start()

    def tearDown(self):
        self.verifyjwt_mock.stop()
        self.get_user_id_mock.stop()

    @patch('core.Chat.chat.process_message')
    def test_main_happy(self, m):
        """Parses the expected ChatMessage from input"""
        cm = ChatMessage('hello', '123', "mock_token", datetime.now())
        req = WebPubSubRequest(cm.to_json(),
                               WebPubSubConnectionContext('456'))
        main(req.to_json())

        # datetime handled by the dataclass json framework is a
        # little weird, so we bypass that
        m.assert_called_once()
        self.assertEqual(m.call_args[0][0].to_json(), cm.to_json())
        self.assertEqual(m.call_args[0][1], '456')

    @patch('core.Chat.chat.ws_log_and_send_error')
    def test_main_sad_1(self, m):
        """
        If anything fails during parsing, an error should go through
        the websocket
        """
        req = WebPubSubRequest('{}',
                               WebPubSubConnectionContext('456'))
        main(req.to_json())
        m.assert_called_once()
        self.assertEqual(m.call_args[0][1], '456')

    @patch('logging.fatal')
    def test_main_sad_2(self, m):
        """
        If anything fails during parsing, an error should go through
        the websocket
        """
        main('')
        m.assert_called_once()

    def __create_mock_chat_completion(
            self,
            message: Optional[str],
            has_choices: bool,
            index_name: Optional[str]
    ) -> Tuple[MagicMock, ChatMessage]:
        mocked_chat_completion = create_autospec(ChatCompletion)
        if has_choices:
            mocked_completion_message = create_autospec(ChatCompletionMessage)
            type(mocked_completion_message).content = PropertyMock(
                return_value=message)
            mocked_choice = create_autospec(Choice)
            type(mocked_choice).message = mocked_completion_message
            type(mocked_chat_completion).choices = [mocked_choice]
        else:
            type(mocked_chat_completion).choices = []

        mock_create = MagicMock(return_value=mocked_chat_completion)
        # This is justified, because ai_client will be mocked by aoi_patch
        ai_client.chat.completions.create = mock_create  # type: ignore[method-assign] # noqa: E501

        if index_name is not None:
            return mock_create, ChatMessage(message='blah',
                                            conversation_id='123',
                                            auth_token='mock_token',
                                            sent_at=datetime.now(),
                                            index=index_name)
        return mock_create, ChatMessage(
            message='blah',
            conversation_id='123',
            sent_at=datetime.now(),
            auth_token="mock_token")

    @patch('core.Chat.chat.ws_send_message')
    @patch('core.Chat.chat.shadow_msg_to_db')
    def test_process_message_happy_no_index(self, shadow, m):
        """
        Message is sent to the chat model cleanly. The default index is used
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, None)

        process_message(message, '123')
        m.assert_called_once()
        self.assertEqual(shadow.call_count, 2)

        # 'blah' is from the user, 'hi' is from the bot
        expected_calls = (('123', 'blah', False), ('123', 'hi', True))
        self.assertEqual(
            tuple(map(lambda x: x.args, shadow.call_args_list)),
            expected_calls)

        self.assertIn('hi', m.call_args[0][0])
        self.assertEqual(m.call_args[0][1], '123')
        self.assertEqual(ai_client.chat.completions.create
                         .call_args_list[0]
                         .kwargs['extra_body']['dataSources'][0]
                         ['parameters']['indexName'], 'validation-index')

        # reset for other tests to use
        mocked_create.reset_mock()

    @patch('core.Chat.chat.ws_send_message')
    def test_process_message_happy_with_index(self, m):
        """
        Message is sent to the chat model cleanly. The default index is used
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, 'other-index')

        process_message(message, '123')
        m.assert_called_once()

        self.assertIn('hi', m.call_args[0][0])
        self.assertEqual(m.call_args[0][1], '123')
        self.assertEqual(ai_client.chat.completions.create
                         .call_args_list[0]
                         .kwargs['extra_body']['dataSources'][0]
                         ['parameters']['indexName'], 'other-index')

        # reset for other tests to use
        mocked_create.reset_mock()

    @patch('core.Chat.chat.ws_log_and_send_error')
    def test_process_message_sad_1(self, m):
        """
        No response from chat model, should respond with errors
        """
        mocked_create, message = self.__create_mock_chat_completion(
            '', False, None)

        process_message(message, '123')
        m.assert_called_once()
        self.assertIn('no response', m.call_args[0][0])

        mocked_create.reset_mock()

    @patch('core.Chat.chat.ws_log_and_send_error')
    def test_process_message_sad_2(self, m):
        """
        No message content, should respond with errors
        """
        mocked_create, message = self.__create_mock_chat_completion(
            '', True, None)

        process_message(message, '123')
        m.assert_called_once()
        self.assertIn('empty response', m.call_args[0][0])

        mocked_create.reset_mock()

    def test_log_and_send_error(self):
        """
        This function should simply forward the call to
        ws_send_message after logging
        """
        with patch('logging.error') as logerror:
            with patch('core.Chat.chat.ws_send_message') as m:
                ws_log_and_send_error('1', '2')
                m.assert_called_once()
                logerror.assert_called_once()

    def test_ws_send_message(self):
        """
        This function should send a message using the WebPubServiceClient
        """
        client_mock = MagicMock()
        with patch(
                'azure.messaging.webpubsubservice._patch'
                '.WebPubSubServiceClient.from_connection_string',
                return_value=client_mock):
            ws_send_message('text', '123')
            client_mock.send_to_connection.assert_called_once_with(
                '123', 'text', content_type='application/json')

    def test_shadow_msg_to_db(self):
        """
        This function should save the message to the database
        """
        # It doesn't matter what arguments are passed to it; the
        # virtue of it being called is enough
        with patch('core.Chat.chat.ChatMessageDAO.save_message') as m:
            shadow_msg_to_db('123', 'blah', True)
            m.assert_called_once()

    def test_strip_all_citations(self):
        """
        This function should remove all citations from a message
        """
        self.assertEqual(strip_all_citations(
            'blah blah blah [doc1] blah blah [doc2]'),
                         'blah blah blah blah blah')
        self.assertEqual(strip_all_citations(
            'blah blah blah [doc1]. blah blah [doc2]'),
                         'blah blah blah. blah blah')
