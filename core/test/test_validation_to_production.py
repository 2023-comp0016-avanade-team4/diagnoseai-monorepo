""" Module for testing the validation_to_production endpoint. """

import os
import unittest
from unittest.mock import patch

from azure.functions import HttpRequest
from azure.core.exceptions import HttpResponseError


# Globals patching
akc_patch = patch('azure.core.credentials.AzureKeyCredential').start()
sc_patch = patch('azure.search.documents.SearchClient').start()
sic_patch = patch('azure.search.documents.indexes.SearchIndexClient').start()
verify_token_patch = patch('utils.verify_token.verify_token').start()
http_response_patch = patch('azure.functions.HttpResponse').start()

os.environ['CognitiveSearchKey'] = 'mock-key'
os.environ['CognitiveSearchEndpoint'] = 'mock-endpoint'
os.environ['ProductionIndexName'] = 'mock-index'

# pylint: disable=wrong-import-position
from core.functions.validation_to_production import main  # noqa: E402


class TestValidationToProduction(unittest.TestCase):
    """
    Tests the validation_to_production endpoint
    """
    req = HttpRequest(
        url="",
        method='POST',
        body=b'{"validationIndexName": "test"}',
        headers={
            'Auth-Token': 'test'
        }
    )

    @staticmethod
    def tearDownClass():
        patch.stopall()

    @patch('core.functions.validation_to_production.productionClient')
    @patch('core.functions.validation_to_production.cognitiveSearchClient')
    def test_main(self, cog_search_client_patch, prod_client_patch):
        """
        Tests that the endpoint returns a 200 when authorized and validation
        index exists
        """
        verify_token_patch.return_value = True
        cog_search_client_patch.list_index_names.return_value = iter(['test'])
        akc_patch.return_value = 'mock-key'
        main(self.req)
        sc_patch.assert_called()
        sic_patch.assert_called()
        akc_patch.assert_called()
        akc_patch.assert_called()
        cog_search_client_patch.list_index_names.assert_called()
        prod_client_patch.upload_documents.assert_called()
        verify_token_patch.assert_called_with('test')
        http_response_patch.assert_called_with(
                'Documents moved to production index',
                status_code=200
        )

    @patch('core.functions.validation_to_production.cognitiveSearchClient')
    def test_validation_index_not_found(self, cog_search_client_patch):
        """
        Tests that the endpoint returns a 404 when validation index not found
        """
        verify_token_patch.return_value = True
        cog_search_client_patch.list_index_names.return_value = iter(
                ['not_test'])
        main(self.req)
        verify_token_patch.assert_called_with('test')
        cog_search_client_patch.list_index_names.assert_called()
        http_response_patch.assert_called_with(
                'Validation index test not found',
                status_code=404
        )

    @patch('core.functions.validation_to_production.cognitiveSearchClient')
    def test_failed_delete_index(self, cog_search_client_patch):
        """
        Tests that the endpoint returns a 500 when deleting the validation
        index fails
        """
        verify_token_patch.return_value = True
        cog_search_client_patch.list_index_names.return_value = iter(['test'])
        cog_search_client_patch.delete_index.side_effect = HttpResponseError(
                'mock-error')
        main(self.req)
        http_response_patch.assert_called_with(
                'Error deleting validation index: mock-error',
                status_code=500
        )

    @patch('core.validation_to_production.SearchIndexClient')
    @patch('core.validation_to_production.SearchClient')
    def test_filepath_added_to_documents(
        self, mock_search_client, mock_search_index_client
    ):
        """
        Tests that the filepath is added correctly to each document
        """
        validation_index_name = "test"
        documents = [
            {"id": "1", "content": "Example 1"},
            {"id": "2", "content": "Example 2"}
        ]

        verify_token_patch.return_value = True
        mock_search_client.return_value.search.return_value.by_page.return_value = iter([documents])  # noqa: E501  pylint: disable=line-too-long

        mock_search_index_client.return_value.list_index_names.return_value = [
            validation_index_name
        ]

        main(self.req)

        expected_filepath = validation_index_name
        for doc in documents:
            self.assertIn('filepath', doc, "Document missing 'filepath' key")
            self.assertEqual(
                doc['filepath'],
                expected_filepath,
                "'filepath' does not match validation index name"
            )
