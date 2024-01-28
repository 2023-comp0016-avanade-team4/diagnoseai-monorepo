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
bsc_patch = patch(
    'azure.storage.blob.BlobServiceClient.from_connection_string') \
    .start()
image_summary_patch = patch('utils.image_summary.ImageSummary')
image_summary_patch.start()

os.environ['WebPubSubConnectionString'] = ''
os.environ['WebPubSubHubName'] = ''
os.environ['OpenAIKey'] = ''
os.environ['OpenAIEndpoint'] = ''
os.environ['CognitiveSearchKey'] = ''
os.environ['CognitiveSearchEndpoint'] = ''
os.environ['DatabaseURL'] = ''
os.environ['DatabaseName'] = ''
os.environ['DatabaseUsername'] = ''
os.environ['DatabasePassword'] = ''
os.environ['ImageBlobConnectionString'] = ''
os.environ['ImageBlobContainer'] = ''
os.environ['GPT4V_API_BASE'] = ''
os.environ['GPT4V_API_KEY'] = ''
os.environ['GPT4V_DEPLOYMENT_NAME'] = ''


# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.Chat.chat import (ai_client, main, process_message,  # noqa: E402
                            ws_log_and_send_error, ws_send_message,
                            shadow_msg_to_db, image_summary)
from core.utils.chat_message import ChatMessage  # noqa: E402
from core.utils.web_pub_sub_interfaces import \
    WebPubSubConnectionContext  # pylint: disable=line-too-long # noqa: E402, E501
from core.utils.web_pub_sub_interfaces import WebPubSubRequest  # noqa: E402


class TestChat(unittest.TestCase):
    """
    Tests the Chat WebSocket API
    """
    def setUp(self):
        image_summary_patch.start()

    def tearDown(self):
        image_summary_patch.stop()

    def test_main_happy(self):
        """Parses the expected ChatMessage from input"""
        cm = ChatMessage('hello', '123', datetime.now())
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
            index_name: Optional[str],
            is_image: bool = False
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
                                            is_image, index_name)
        return mock_create, ChatMessage('blah', '123', datetime.now(),
                                        is_image)

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
                expected_calls = (('123', 'blah', False, False),
                                  ('123', 'hi', True, False))
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

    def test_process_message_happy_image(self):
        """
        Message is sent to the chat model cleanly. The default index is used.
        We're testing to see if image endpoints are called correctly here
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, 'other-index', True)
        message.message = 'data:/image/png;base64,Y2x1ZWxlc3M='
        with patch('core.Chat.chat.ws_send_message') as m, \
             patch('core.Chat.chat.compress_image') as n, \
             patch('core.Chat.chat.save_to_blob') as s, \
             patch('core.Chat.chat.is_url_encoded_image') as v, \
             patch('core.Chat.chat.shadow_msg_to_db') as shadow:
            n.return_value = b'compressed'
            v.return_value = True
            image_summary.get_image_summary.return_value = 'summary'

            process_message(message, '123')
            m.assert_called_once()
            n.assert_called_once()
            s.assert_called_once()
            image_summary.get_image_summary.assert_called_once()
            shadow.assert_called()
            self.assertTrue(not shadow.call_args_list[0][0][2])
            self.assertEqual(shadow.call_args_list[1][0][1], 'summary')
            self.assertTrue(shadow.call_args_list[1][0][2])

        # reset for other tests to use
        mocked_create.reset_mock()
        image_summary.reset_mock()

    def test_process_message_sad_image_1(self):
        """
        Image not actually an image
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, 'other-index', True)
        message.message = 'data:/image/png;base64,Y2x1ZWxlc3M='
        with patch('core.Chat.chat.ws_send_message'), \
             patch('core.Chat.chat.compress_image') as n, \
             self.assertRaisesRegex(RuntimeError, 'not a URL encoded'):
            n.return_value = b'compressed'
            process_message(message, '123')

        # reset for other tests to use
        mocked_create.reset_mock()

    def test_process_message_sad_image_2(self):
        """
        Image cannot be compressed
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, 'other-index', True)
        message.message = 'data:/image/png;base64,Y2x1ZWxlc3M='
        with patch('core.Chat.chat.ws_send_message'), \
             patch('core.Chat.chat.compress_image') as n, \
             patch('core.Chat.chat.is_url_encoded_image') as v, \
             self.assertRaises(OSError):
            v.return_value = True
            n.side_effect = OSError('trigger error')
            process_message(message, '123')

        # reset for other tests to use
        mocked_create.reset_mock()

    def test_process_message_sad_image_3(self):
        """
        Image cannot be summarized
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, 'other-index', True)
        message.message = 'data:/image/png;base64,Y2x1ZWxlc3M='
        with patch('core.Chat.chat.ws_send_message'), \
             patch('core.Chat.chat.compress_image') as n, \
             patch('core.Chat.chat.save_to_blob'), \
             patch('core.Chat.chat.is_url_encoded_image') as v, \
             patch('core.Chat.chat.shadow_msg_to_db'), \
             self.assertRaises(RuntimeError):
            image_summary.get_image_summary.side_effect = RuntimeError(
                "some error")
            v.return_value = True
            n.return_value = b'compressed'
            process_message(message, '123')

        # reset for other tests to use
        image_summary.reset_mock()
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
            shadow_msg_to_db('123', 'blah', True, False)
            m.assert_called_once()
