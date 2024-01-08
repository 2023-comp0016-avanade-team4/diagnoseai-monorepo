"""
Module to test the chat image endpoint
"""

import os
import unittest
from unittest.mock import patch, MagicMock

import azure.functions as func  # type: ignore[import-untyped]

# Globals patching
bc_patch = patch(
    'azure.storage.blob.BlobServiceClient.from_connection_string'
).start()
bc_instance_mock = MagicMock()
bc_patch.return_value = bc_instance_mock

os.environ['ImageBlobConnectionString'] = ''
os.environ['ImageBlobContainer'] = ''

# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.chat_img.api import (main, save_to_blob,  # noqa: E402
                               shadow_to_db, handle_post)


class TestChatImg(unittest.TestCase):
    """
    Tests the Chat Image API
    """
    def test_main_post(self):
        """
        Main redirects POST requests to the handler
        """
        with patch(
                'core.chat_img.api.handle_post'
        ) as m:
            main(
                func.HttpRequest(
                    'POST', "/api/chat_image",
                    params={'conversation_id': '123'},
                    body=b''))
            m.assert_called_once()

    def test_main_any_other_requests(self):
        """
        Main should throw a 200 OK for any other requests
        """
        response = main(
            func.HttpRequest(
                'GET', "/api/chat_image",
                params={'conversation_id': '123'},
                body=b''))
        self.assertEqual(response.status_code, 200)

    def test_handle_post_no_conv_id(self):
        """
        If there is no conversation ID, hande_post should return 400
        """
        response = handle_post(
            func.HttpRequest(
                'POST', "/api/chat_image",
                params={},
                body=b''))
        self.assertEqual(response.status_code, 400)

    def test_handle_post_no_body(self):
        """
        If there is a conversation ID, but no body, handle_post should
        return 400
        """
        response = handle_post(
            func.HttpRequest(
                'POST', "/api/chat_image",
                params={'conversation_id': '123'},
                body=b''))
        self.assertEqual(response.status_code, 400)
        self.assertIn('unsupported', response.get_body().decode())

    def test_handle_post_body_not_image(self):
        """
        If there is a conversation ID, but the body is not an image,
        handle_post should return 400
        """
        with patch(
                'puremagic.from_string',
                return_value='text/plain'
        ):
            response = handle_post(
                func.HttpRequest(
                    'POST', "/api/chat_image",
                    params={'conversation_id': '123'},
                    body=b''))
            self.assertEqual(response.status_code, 400)
            self.assertIn('unsupported', response.get_body().decode())

    def test_handle_post_failed_compress_image(self):
        """
        If there is both a conversation ID and body, but the image
        cannot be compressed, return a 500
        """
        with patch(
                'puremagic.from_string',
                return_value='image/png'
        ), patch(
            'core.chat_img.api.compress_image',
            side_effect=OSError
        ):
            response = handle_post(
                func.HttpRequest(
                    'POST', "/api/chat_image",
                    params={'conversation_id': '123'},
                    body=b'something'))
            self.assertEqual(response.status_code, 500)

    def test_handle_post_happy_flow(self):
        """
        Conversation ID specified, body specified, image can be compressed.
        Ensures that shadow_to_db is called
        """
        with patch(
                'core.chat_img.api.compress_image',
                return_value=b'compressed'
        ) as m, patch(
            'core.chat_img.api.shadow_to_db'
        ) as shadow, patch(
            'puremagic.from_string',
            return_value='image/png'
        ):
            response = handle_post(
                func.HttpRequest(
                    'POST', "/api/chat_image",
                    params={'conversation_id': '123'},
                    body=b'something'))
            self.assertEqual(response.status_code, 200)
            shadow.assert_called_once()
            m.assert_called_once()

    def test_shadow_to_db(self):
        """
        This function should call save_reference_to_db and save_to_blob
        """
        with patch(
                'core.chat_img.api.save_reference_to_db'
        ) as save_ref, patch(
            'core.chat_img.api.save_to_blob'
        ) as save_blob:
            shadow_to_db('123', b'compressed')
            save_ref.assert_called_once()
            save_blob.assert_called_once()

    def test_save_to_blob(self):
        """
        This function should call upload_blob
        """
        blob_client_mock = MagicMock()
        bc_instance_mock.get_blob_client.return_value = blob_client_mock
        save_to_blob('123', b'compressed')
        blob_client_mock.upload_blob.assert_called_once_with(b'compressed')

    def tearDown(self):
        bc_instance_mock.reset_mock()
