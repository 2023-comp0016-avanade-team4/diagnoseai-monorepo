""" Module for testing the validation_to_production endpoint. """

import os
import unittest
from unittest.mock import patch
from base_test_case import BaseTestCase

from azure.functions import HttpRequest
from azure.core.exceptions import HttpResponseError


# Globals patching
akc_patch = patch('azure.core.credentials.AzureKeyCredential').start()
sic_patch = patch('azure.search.documents.indexes.SearchIndexClient').start()
verify_token_patch = patch('utils.verify_token.verify_token').start()
http_response_patch = patch('azure.functions.HttpResponse').start()
bsc_patch = patch('azure.storage.blob.BlobServiceClient').start()

os.environ['CognitiveSearchKey'] = 'mock-key'
os.environ['CognitiveSearchEndpoint'] = 'mock-endpoint'
os.environ['DocumentStorageContainer'] = 'mock-container'
os.environ['DocumentStorageConnection'] = 'mock-connection'

# pylint: disable=wrong-import-position
from core.functions.validation_to_production import main  # noqa: E402


class TestValidationToProduction(BaseTestCase):
    """
    Tests the validation_to_production endpoint
    """
    req = HttpRequest(
        url="",
        method='POST',
        body=(b'{"validation_index_name": "test",'
              b'"production_index_name": "mock-index"}'),
        headers={
            'Auth-Token': 'test'
        }
    )

    @patch('core.functions.validation_to_production.SearchClient')
    @patch('core.functions.validation_to_production.cognitiveSearchClient')
    def test_main(self, cog_search_client_patch, sc_patch):
        """
        Tests that the endpoint returns a 200 when authorized and validation
        index exists
        """
        verify_token_patch.return_value = True
        cog_search_client_patch.list_index_names.return_value = [
            'test', 'mock-index']
        akc_patch.return_value = 'mock-key'
        documents = [
            {"id": "1", "content": "Example 1",
             "filepath": None},
            {"id": "2", "content": "Example 2",
             "filepath": None}
        ]
        sc_patch.return_value.search.return_value.by_page.return_value = \
            iter([documents])
        main(self.req)
        sc_patch.assert_called()
        sic_patch.assert_called()
        akc_patch.assert_called()
        akc_patch.assert_called()
        bsc_patch.from_connection_string.return_value.\
            get_container_client.return_value.\
            get_blob_client.return_value.\
            start_copy_from_url.assert_called()
        cog_search_client_patch.list_index_names.assert_called()
        sc_patch.return_value.upload_documents.assert_called()
        verify_token_patch.assert_called_with('test')
        http_response_patch.assert_called_with(
                'Documents moved to production index with filepath added',
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

    @patch('core.functions.validation_to_production.SearchClient')
    @patch('core.functions.validation_to_production.cognitiveSearchClient')
    def test_failed_delete_index(self, cog_search_client_patch, sc_patch):
        """
        Tests that the endpoint returns a 500 when deleting the validation
        index fails
        """
        verify_token_patch.return_value = True
        cog_search_client_patch.list_index_names.return_value = ['test',
                                                                 'mock-index']
        cog_search_client_patch.delete_index.side_effect = HttpResponseError(
                'mock-error')
        documents = [
            {"id": "1", "content": "Example 1",
             "filepath": None},
            {"id": "2", "content": "Example 2",
             "filepath": None}
        ]
        sc_patch.return_value.search.return_value.by_page.return_value = \
            iter([documents])
        main(self.req)
        sc_patch.assert_called()
        sc_patch.return_value.upload_documents.assert_called()
        http_response_patch.assert_called_with(
                'Error deleting validation index: mock-error',
                status_code=500
        )

    @patch('core.functions.validation_to_production.SearchClient')
    def test_filepath_added_to_documents(self, mock_search_client):
        """
        Tests that the filepath is added correctly to each document
        """
        validation_index_name = "test"
        documents = [
            {"id": "1", "content": "Example 1",
             "filepath": None},
            {"id": "2", "content": "Example 2",
             "filepath": None}
        ]

        verify_token_patch.return_value = True
        mock_search_client.return_value.search.return_value.by_page.return_value = iter([documents])  # noqa: E501  pylint: disable=line-too-long

        sic_patch.return_value.list_index_names.return_value = [
            validation_index_name,
            'mock-index'
        ]

        main(self.req)

        mock_search_client.return_value.upload_documents.assert_called()
        _, args, _ = mock_search_client.return_value.upload_documents\
                                                    .mock_calls[0]
        documents = args[0]

        for doc in documents:
            self.assertIn('filepath', doc, "Document missing 'filepath' key")
            self.assertEqual(
                doc['filepath'],
                f"{validation_index_name}.pdf",
                "'filepath' does not match validation index name"
            )
