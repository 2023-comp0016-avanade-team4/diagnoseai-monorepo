"""
Module to test the get_preauthenticated_blob_url function.
"""

import unittest
from unittest.mock import patch, MagicMock
from utils.get_preauthenticated_blob_url import get_preauthenticated_blob_url


class TestGetPreauthenticatedBlobUrl(unittest.TestCase):
    def test_preauthenticated_blob_url_generates_tokens(self):
        """
        Ensures that generate_blob_sas is called.
        """
        with patch(
                'utils.get_preauthenticated_blob_url.generate_blob_sas'
        ) as m:
            client = MagicMock()
            blob_client = MagicMock()
            client.get_blob_client.return_value = blob_client
            blob_client.url = 'some_url'

            m.return_value = 'test_token'
            token = \
                get_preauthenticated_blob_url(client, 'container_name',
                                              'some_file')
            m.assert_called_once()
            self.assertEqual(token, 'some_url?test_token')
