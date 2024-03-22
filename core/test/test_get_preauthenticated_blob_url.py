"""
Module to test the get_preauthenticated_blob_url function.
"""

from unittest.mock import patch, MagicMock
from core.utils.get_preauthenticated_blob_url import \
    get_preauthenticated_blob_url
from base_test_case import BaseTestCase


class TestGetPreauthenticatedBlobUrl(BaseTestCase):
    """
    Tests the preauthenticated blob URL function
    """
    @patch('core.utils.get_preauthenticated_blob_url.generate_blob_sas')
    def test_preauthenticated_blob_url_generates_tokens(self, m):
        """
        Ensures that generate_blob_sas is called.
        """
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
