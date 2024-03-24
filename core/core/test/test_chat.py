"""
Module to test the chat endpoint
"""

from datetime import datetime
from typing import Optional, Tuple
from unittest.mock import MagicMock, PropertyMock, create_autospec, patch

from azure.core.exceptions import ResourceNotFoundError
from core.functions.chat import (
    main, process_message, shadow_msg_to_db, strip_all_citations,
    ws_log_and_send_error, ws_send_message)
from core.utils.chat_message import ChatMessage
from core.utils.web_pub_sub_interfaces import \
    WebPubSubConnectionContext
from core.utils.web_pub_sub_interfaces import \
    WebPubSubRequest
from openai.types.chat.chat_completion import (ChatCompletion,
                                               ChatCompletionMessage, Choice)

from base_test_case import BaseTestCase


class TestChat(BaseTestCase):
    """
    Tests the Chat WebSocket API
    """
    @classmethod
    def setUpClass(cls):
        super().secrets_and_services_mock('core.functions.chat')

    def setUp(self):
        self.verifyjwt_mock = patch('core.functions.chat.verify_token',
                                    return_value=True).start()
        self.get_user_id_mock = patch('core.functions.chat.get_user_id',
                                      return_value='123').start()
        patch('core.functions.chat.authorise_user', return_value=True).start()
        self.ai_client = self.services_mock.return_value.openai_chat_model
        self.image_summary = self.services_mock.return_value.\
            image_summary_model
        self.does_index_exist = patch('core.functions.chat.does_index_exist',
                                      return_value=True).start()

    def tearDown(self):
        super().tearDown()
        self.verifyjwt_mock.stop()
        self.get_user_id_mock.stop()

    @patch('core.functions.chat.process_message')
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

    @patch('core.functions.chat.ws_log_and_send_error')
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
            index_name: Optional[str],
            is_image: bool = False
    ) -> Tuple[MagicMock, ChatMessage]:
        mocked_chat_completion = create_autospec(ChatCompletion)
        if has_choices:
            mocked_completion_message = create_autospec(ChatCompletionMessage)
            type(mocked_completion_message).content = PropertyMock(
                return_value=message)
            type(mocked_completion_message).context = {'citations': []}
            mocked_choice = create_autospec(Choice)
            type(mocked_choice).message = mocked_completion_message
            type(mocked_chat_completion).choices = [mocked_choice]
        else:
            type(mocked_chat_completion).choices = []

        mock_create = MagicMock(return_value=mocked_chat_completion)
        self.ai_client.chat.completions.create = mock_create  # pylint: disable=line-too-long # type: ignore[method-assign] # noqa: E501

        if index_name is not None:
            return mock_create, ChatMessage(message='blah',
                                            conversation_id='123',
                                            auth_token='mock_token',
                                            sent_at=datetime.now(),
                                            is_image=is_image,
                                            index=index_name)
        return mock_create, ChatMessage(
            message='blah',
            conversation_id='123',
            sent_at=datetime.now(),
            is_image=is_image,
            auth_token="mock_token")

    @patch('core.functions.chat.get_search_index_for_user_id',
           return_value='validation-index')
    @patch('core.functions.chat.ws_send_message')
    @patch('core.functions.chat.shadow_msg_to_db')
    def test_process_message_happy_no_index(self, shadow, m, _hasher):
        """
        Message is sent to the chat model cleanly. The default index is used
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, None)

        process_message(message, '123')
        m.assert_called_once()
        self.assertEqual(shadow.call_count, 2)

        # 'blah' is from the user, 'hi' is from the bot
        expected_calls = (('123', 'blah', False, False, []),
                          ('123', 'hi', True, False, []))
        self.assertEqual(
            tuple(map(lambda x: x.args, shadow.call_args_list)),
            expected_calls)

        self.assertIn('hi', m.call_args[0][0])
        self.assertEqual(m.call_args[0][1], '123')
        self.assertEqual(self.ai_client.chat.completions.create.call_count, 6)
        self.assertEqual(self.ai_client.chat.completions.create
                         .call_args_list[0]
                         .kwargs['extra_body']['data_sources'][0]
                         ['parameters']['indexName'], 'validation-index')

        # check that summary is used
        self.assertIn('in',
                      self.ai_client.chat.completions.create.call_args_list[1]
                      .kwargs['extra_body']['data_sources']
                      [0]['parameters']['roleInformation'])
        self.assertEqual('blah',
                         self.ai_client.chat.completions.create
                         .call_args_list[1]
                         .kwargs['messages'][0]['content'])

        # reset for other tests to use
        mocked_create.reset_mock()

    @patch('core.functions.chat.get_search_index_for_user_id',
           return_value='other-index')
    @patch('core.functions.chat.ws_send_message')
    def test_process_message_happy_with_index(self, m, _hasher):
        """
        Message is sent to the chat model cleanly. The default index is used
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, 'other-index')

        process_message(message, '123')
        m.assert_called_once()

        self.assertIn('hi', m.call_args[0][0])
        self.assertEqual(m.call_args[0][1], '123')
        self.assertEqual(self.ai_client.chat.completions.create.call_count, 6)
        self.assertEqual(self.ai_client.chat.completions.create
                         .call_args_list[0]
                         .kwargs['extra_body']['data_sources'][0]
                         ['parameters']['indexName'], 'other-index')

        # check that summary is used
        self.assertIn('in',
                      self.ai_client.chat.completions.create.call_args_list[1]
                      .kwargs['extra_body']['data_sources']
                      [0]['parameters']['roleInformation'])
        self.assertEqual('blah',
                         self.ai_client.chat.completions.create
                         .call_args_list[1]
                         .kwargs['messages'][0]['content'])

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
        with patch('core.functions.chat.ws_send_message') as m, \
             patch('core.functions.chat.compress_image') as n, \
             patch('core.functions.chat.save_to_blob') as s, \
             patch('core.functions.chat.is_url_encoded_image') as v, \
             patch('core.functions.chat.shadow_msg_to_db') as shadow:
            n.return_value = b'compressed'
            v.return_value = True
            self.image_summary.get_image_summary.return_value = 'summary'

            process_message(message, '123')
            m.assert_called_once()
            n.assert_called_once()
            s.assert_called_once()
            self.image_summary.get_image_summary.assert_called_once()
            shadow.assert_called()
            self.assertTrue(not shadow.call_args_list[0][0][2])
            self.assertEqual(shadow.call_args_list[1][0][1],
                             'USER IMAGE: summary')
            self.assertTrue(shadow.call_args_list[1][0][2])

        # reset for other tests to use
        mocked_create.reset_mock()

    def test_process_message_sad_image_1(self):
        """
        Image not actually an image
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, 'other-index', True)
        message.message = 'data:/image/png;base64,Y2x1ZWxlc3M='
        with patch('core.functions.chat.ws_send_message'), \
             patch('core.functions.chat.compress_image') as n, \
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
        with patch('core.functions.chat.ws_send_message'), \
             patch('core.functions.chat.compress_image') as n, \
             patch('core.functions.chat.is_url_encoded_image') as v, \
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
        with patch('core.functions.chat.ws_send_message'), \
             patch('core.functions.chat.compress_image') as n, \
             patch('core.functions.chat.save_to_blob'), \
             patch('core.functions.chat.is_url_encoded_image') as v, \
             patch('core.functions.chat.shadow_msg_to_db'), \
             self.assertRaises(RuntimeError):
            self.image_summary.get_image_summary.side_effect = RuntimeError(
                "some error")
            v.return_value = True
            n.return_value = b'compressed'
            process_message(message, '123')

        # reset for other tests to use
        mocked_create.reset_mock()

    @patch('core.functions.chat.get_search_index_for_user_id',
           return_value='not-found-index')
    @patch('core.functions.chat.ws_send_message')
    def test_process_message_happy_summary_index_not_found(self, m, _hasher):
        """
        Message is sent to the chat model cleanly. The default index is used,
        but the summary index is not found.
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, 'other-index')

        self.does_index_exist.side_effect = \
            lambda x, _ignore: x == 'other-index'
        process_message(message, '123')
        m.assert_called_once()

        self.assertIn('hi', m.call_args[0][0])
        self.assertEqual(m.call_args[0][1], '123')
        self.assertEqual(self.ai_client.chat.completions.create.call_count, 3)
        self.assertEqual(self.ai_client.chat.completions.create
                         .call_args_list[0]
                         .kwargs['extra_body']['data_sources'][0]
                         ['parameters']['indexName'], 'other-index')

        # reset for other tests to use
        self.does_index_exist.side_effect = None
        mocked_create.reset_mock()

    @patch('core.functions.chat.ws_log_and_send_error')
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

    @patch('core.functions.chat.ws_log_and_send_error')
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

    @patch('core.functions.chat.ws_log_and_send_error')
    def test_process_message_sad_3(self, m):
        """
        Search index not found, should respond with errors
        """
        self.does_index_exist.return_value = False
        mocked_create, message = self.__create_mock_chat_completion(
            'xdx', True, None)

        process_message(message, '123')
        m.assert_called_once()

        mocked_create.reset_mock()
        self.does_index_exist.return_value = True

    def test_log_and_send_error(self):
        """
        This function should simply forward the call to
        ws_send_message after logging
        """
        with patch('logging.error') as logerror:
            with patch('core.functions.chat.ws_send_message') as m:
                ws_log_and_send_error('1', '2')
                m.assert_called_once()
                logerror.assert_called_once()

    def test_ws_send_message(self):
        """
        This function should send a message using the WebPubServiceClient
        """
        ws_send_message('text', '123')
        self.services_mock.return_value.webpubsub.\
            send_to_connection.assert_called_once_with(
                '123', 'text', content_type='application/json')

    @patch('core.functions.chat.ChatMessageDAO.save_message')
    def test_shadow_msg_to_db(self, m):
        """
        This function should save the message to the database
        """
        # It doesn't matter what arguments are passed to it; the
        # virtue of it being called is enough
        shadow_msg_to_db('123', 'blah', True, False, [])
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

    @patch('core.functions.chat.get_search_index_for_user_id',
           return_value='validation-index')
    @patch('core.functions.chat.ws_send_message')
    @patch('core.functions.chat.ChatMessageDAO.save_message')
    def test_ethereal_conversation_does_not_save_message(self, dao_save_msg,
                                                         _m1, _m2):
        """
        If the conversation id is '-1', the message should not be saved
        """
        mocked_create, message = self.__create_mock_chat_completion(
            'hi', True, None)
        message.conversation_id = '-1'
        process_message(message, '123')
        dao_save_msg.assert_not_called()

        mocked_create.reset_mock()
