"""
Tests the proof of concept function
"""

from unittest.mock import MagicMock

from azure.core.exceptions import ResourceNotFoundError
from core.utils.search_utils import is_index_ready, does_index_exist

from base_test_case import BaseTestCase


class TestSearchUtils(BaseTestCase):
    """
    Tests the search utils
    """
    def test_index_ready(self):
        """
        Tests if the index is ready
        """
        index_client = MagicMock()
        index_client.get_index_statistics.return_value = {'document_count': 1}
        self.assertTrue(is_index_ready('test', index_client))

    def test_index_not_ready(self):
        """
        Tests if the index is not ready
        """
        index_client = MagicMock()
        index_client.get_index_statistics.return_value = {'document_count': 0}
        self.assertFalse(is_index_ready('test', index_client))

    def test_index_not_found(self):
        """
        Tests if the index is not found
        """
        index_client = MagicMock()
        index_client.get_index.side_effect = ResourceNotFoundError
        self.assertFalse(is_index_ready('test', index_client))

    def test_index_no_document_count(self):
        """
        Tests if the index has no document count
        """
        index_client = MagicMock()
        index_client.get_index_statistics.return_value = {}
        self.assertFalse(is_index_ready('test', index_client))

    def test_does_index_exist(self):
        """
        Tests if the index exists
        """
        index_client = MagicMock()
        self.assertTrue(does_index_exist('test', index_client))

    def test_does_index_not_exist(self):
        """
        Tests if the index does not exist
        """
        index_client = MagicMock()
        index_client.get_index.side_effect = ResourceNotFoundError
        self.assertFalse(does_index_exist('test', index_client))
