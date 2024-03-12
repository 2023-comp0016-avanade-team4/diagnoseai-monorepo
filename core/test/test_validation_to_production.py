""" Module for testing the validation_to_production endpoint. """

import os
import unittest
from unittest.mock import patch

from azure.functions import HttpRequest
from azure.core.exceptions import HttpResponseError


# Globals patching
akc_patch = patch('azure.core.credentials.AzureKeyCredential').start()
sic_patch = patch('azure.search.documents.indexes.SearchIndexClient').start()
http_response_patch = patch('azure.functions.HttpResponse').start()
verify_token_patch = patch('utils.verify_token.verify_token').start()

os.environ['CognitiveSearchKey'] = 'mock-key'
os.environ['CognitiveSearchEndpoint'] = 'mock-endpoint'

# pylint: disable=wrong-import-position
from core.validation_to_production import main  # noqa: E402


class TestValidationToProduction(unittest.TestCase):
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

    def tearDown(self):
        patch.stopall()

    @patch('core.validation_to_production.SearchClient')
    @patch('core.validation_to_production.cognitiveSearchClient')
    def test_main(self, cog_search_client_patch, sc_patch):
        """
        Tests that the endpoint returns a 200 when authorized and validation
        index exists
        """
        verify_token_patch.return_value = True
        cog_search_client_patch.list_index_names.return_value = [
            'test', 'mock-index']
        akc_patch.return_value = 'mock-key'
        main(self.req)
        sc_patch.assert_called()
        sic_patch.assert_called()
        akc_patch.assert_called()
        akc_patch.assert_called()
        cog_search_client_patch.list_index_names.assert_called()
        sc_patch.return_value.upload_documents.assert_called()
        verify_token_patch.assert_called_with('test')
        http_response_patch.assert_called_with(
                'Documents moved to production index',
                status_code=200
        )

    @patch('core.validation_to_production.cognitiveSearchClient')
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

    @patch('core.validation_to_production.SearchClient')
    @patch('core.validation_to_production.cognitiveSearchClient')
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
        main(self.req)
        sc_patch.assert_called()
        sc_patch.return_value.upload_documents.assert_called()
        http_response_patch.assert_called_with(
                'Error deleting validation index: mock-error',
                status_code=500
        )

    def test_unauthorised(self):
        """Tests that the endpoint returns a 401 when unauthorized"""
        verify_token_patch.return_value = False
        main(self.req)
        verify_token_patch.assert_called_with('test')
        http_response_patch.assert_called_with('Unauthorized', status_code=401)
