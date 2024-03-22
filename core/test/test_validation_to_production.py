""" Module for testing the validation_to_production endpoint. """

from unittest.mock import patch

from azure.core.exceptions import HttpResponseError
from azure.functions import HttpRequest
from core.functions.validation_to_production import main  # noqa: E402

from base_test_case import BaseTestCase


class TestValidationToProduction(BaseTestCase):
    """
    Tests the validation_to_production endpoint
    """
    @classmethod
    def setUpClass(cls):
        cls.secrets_and_services_mock(
            'core.functions.validation_to_production',
            no_secret=True)

    def setUp(self):
        self.req = HttpRequest(
            url="",
            method='POST',
            body=(b'{"validation_index_name": "test",'
                  b'"production_index_name": "mock-index"}'),
            headers={
                'Auth-Token': 'test'
            }
        )

        # automatically released in teardown
        patch('core.functions.validation_to_production.verify_token',
              return_value=True).start()

    def test_main(self):
        """
        Tests that the endpoint returns a 200 when authorized and validation
        index exists
        """
        cog_search_client = self.services_mock.return_value.\
            document_cognitive_search_index
        cog_search_client.list_index_names.return_value = [
            'test', 'mock-index']
        sc_patch = cog_search_client.get_search_client
        validation_container_client = self.services_mock.return_value.\
            validation_container_client
        production_container_client = self.services_mock.return_value.\
            production_container_client
        documents = [
            {"id": "1", "content": "Example 1",
             "filepath": None},
            {"id": "2", "content": "Example 2",
             "filepath": None}
        ]
        sc_patch.return_value.search.return_value.by_page.return_value = \
            iter([documents])
        response = main(self.req)
        self.assertEqual(response.status_code, 200)
        sc_patch.assert_called()
        validation_container_client.get_blob_client.assert_called()
        production_container_client.get_blob_client.assert_called()
        production_container_client.get_blob_client.return_value.\
            start_copy_from_url.assert_called()
        cog_search_client.list_index_names.assert_called()
        sc_patch.return_value.upload_documents.assert_called()

    def test_validation_index_not_found(self):
        """
        Tests that the endpoint returns a 404 when validation index not found
        """
        cog_search_client = self.services_mock.return_value.\
            document_cognitive_search_index
        cog_search_client.list_index_names.return_value = iter(
                ['not_test'])
        response = main(self.req)
        self.assertEqual(response.status_code, 404)
        cog_search_client.list_index_names.assert_called()

    def test_failed_delete_index(self):
        """
        Tests that the endpoint returns a 500 when deleting the validation
        index fails
        """
        cog_search_client = self.services_mock.return_value.\
            document_cognitive_search_index
        cog_search_client.list_index_names.return_value = [
            'test', 'mock-index']
        cog_search_client.delete_index.side_effect = HttpResponseError(
                'mock-error')
        sc_patch = cog_search_client.get_search_client
        documents = [
            {"id": "1", "content": "Example 1",
             "filepath": None},
            {"id": "2", "content": "Example 2",
             "filepath": None}
        ]
        sc_patch.return_value.search.return_value.by_page.return_value = \
            iter([documents])
        response = main(self.req)
        self.assertEqual(response.status_code, 500)
        sc_patch.assert_called()
        sc_patch.return_value.upload_documents.assert_called()

        cog_search_client.delete_index.side_effect = None

    def test_filepath_added_to_documents(self):
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

        cog_search_client = self.services_mock.return_value.\
            document_cognitive_search_index
        cog_search_client.list_index_names.return_value = [
            validation_index_name, 'mock-index']
        sc_patch = cog_search_client.get_search_client
        sc_patch.return_value.search.return_value.by_page.return_value \
            = iter([documents])

        main(self.req)

        sc_patch.return_value.upload_documents.assert_called()
        _, args, _ = sc_patch.return_value.upload_documents\
                                          .mock_calls[0]
        documents = args[0]

        for doc in documents:
            self.assertIn('filepath', doc, "Document missing 'filepath' key")
            self.assertEqual(
                doc['filepath'],
                f"{validation_index_name}.pdf",
                "'filepath' does not match validation index name"
            )
