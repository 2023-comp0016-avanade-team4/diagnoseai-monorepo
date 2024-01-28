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

os.environ['WebPubSubConnectionString'] = ''
os.environ['WebPubSubHubName'] = ''
os.environ['OpenAIKey'] = ''
os.environ['OpenAIEndpoint'] = ''
os.environ['CLERK_PUBLIC_KEY'] = 'test'
os.environ['CLERK_AZP_LIST'] = 'test'

# patching the verify_token function

vjwt_patch = patch('utils.verify_token.verify_token').start()
vjwt_patch.return_value = True

os.environ['CognitiveSearchKey'] = ''
os.environ['CognitiveSearchEndpoint'] = ''
os.environ['DatabaseURL'] = ''
os.environ['DatabaseName'] = ''
os.environ['DatabaseUsername'] = ''
os.environ['DatabasePassword'] = ''


# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.Chat.chat import (ai_client, main, process_message,  # noqa: E402
                            ws_log_and_send_error, ws_send_message,
                            shadow_msg_to_db)
from core.utils.chat_message import ChatMessage  # noqa: E402
from core.utils.web_pub_sub_interfaces import \
    WebPubSubConnectionContext  # pylint: disable=line-too-long # noqa: E402, E501
from core.utils.web_pub_sub_interfaces import WebPubSubRequest

class TestChat(unittest.TestCase):
    """
    Tests the Chat WebSocket API
    """
    def test_main_happy(self):
        """Parses the expected ChatMessage from input"""
        cm = ChatMessage('hello', '123', "mock_token", datetime.now())
        req = WebPubSubRequest(cm.to_json(),
                               WebPubSubConnectionContext('456'))
        with patch('core.Chat.chat.process_message') as m:
            main(req.to_json())

            # datetime handled by the dataclass json framework is a
            # little weird, so we bypass that
            m.assert_called_once()
            self.assertEqual(m.call_args[0][0].to_json(), cm.to_json())
            self.assertEqual(m.call_args[0][1], '456')

    def test_main_sad_1(self):
        """
        If anything fails during parsing, an error should go through
        the websocket
        """
        req = WebPubSubRequest('{}',
                               WebPubSubConnectionContext('456'))
        with patch('core.Chat.chat.ws_log_and_send_error') as m:
            main(req.to_json())
            m.assert_called_once()
            self.assertEqual(m.call_args[0][1], '456')

    def test_main_sad_2(self):
        """
        If anything fails during parsing, an error should go through
        the websocket
        """
        with patch('logging.fatal') as m:
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
            return mock_create, ChatMessage('blah', '123', datetime.now(),
                                            index_name)
        return mock_create, ChatMessage(
            'blah', '123', datetime.now(), "mock_token")

    def test_process_message_happy_no_index(self):
        """
        Message is sent to the chat model cleanly. The default index is used
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, None)

        with patch('core.Chat.chat.ws_send_message') as m:
            with patch('core.Chat.chat.shadow_msg_to_db') as shadow:
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

    def test_process_message_happy_with_index(self):
        """
        Message is sent to the chat model cleanly. The default index is used
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, 'other-index')

        with patch('core.Chat.chat.ws_send_message') as m:
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

    def test_process_message_sad_1(self):
        """
        No response from chat model, should respond with errors
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', False, None)

        with patch('core.Chat.chat.ws_log_and_send_error') as m:
            process_message(message, '123')
            m.assert_called_once()

        mocked_create.reset_mock()

    def test_process_message_sad_2(self):
        """
        No message content, should respond with errors
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', False, None)

        with patch('core.Chat.chat.ws_log_and_send_error') as m:
            process_message(message, '123')
            m.assert_called_once()

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
