""" Tests the blob trigger function """
import os
import unittest
from unittest.mock import patch
from base_test_case import BaseTestCase
from core.models.pending_uploads import PendingUploadsModel

# Globals patching

dac_patch = patch('azure.ai.formrecognizer.DocumentAnalysisClient') \
    .start()
dip_patch = patch('langchain_community.document_loaders.pdf.DocumentIntelligenceParser') \
    .start()
akc_patch = patch('azure.core.credentials.AzureKeyCredential') \
    .start()
aoie_patch = patch('langchain_openai.AzureOpenAIEmbeddings') \
    .start()
as_patch = patch('langchain_community.vectorstores.azuresearch.AzureSearch') \
    .start()
is_patch = patch('azure.functions.InputStream') \
    .start()
db_session_patch = patch('utils.db.create_session') \
    .start()
sc_patch = patch('azure.search.documents.indexes.SearchIndexClient') \
    .start()

# Environment patching

environ_patch = patch.dict(os.environ, {
    "CognitiveSearchKey": "mock_key",
    "CognitiveSearchEndpoint": "mock_endpoint",
    "OpenAIKey": "mock_key",
    "OpenAIEndpoint": "mock_endpoint",
    "DocumentEndpoint": "mock_endpoint",
    "DocumentKey": "mock_key",
    "SMTPServer": "mock_server",
    "SMTPUsername": "mock_username",
    "SMTPPassword": "mock_password",
    "UploaderBaseURL": "mock_url",
    "DatabaseURL": "mock_url",
    "DatabaseName": "mock_name",
    "DatabaseUsername": "mock_username",
    "DatabasePassword": "mock_password",
    "DatabaseSelfSigned": "false"
}).start()

# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.functions.file_upload_trigger import main, process_outstanding_index  # noqa: E402


class TestFileUploadTrigger(BaseTestCase):
    """
    Class to test file upload trigger
    """
    def setUp(self):
        self.model = PendingUploadsModel(
            upload_id='test_id',
            filename='test.pdf',
            username='test',
            user_email='test@example.com')

    @patch('core.functions.file_upload_trigger.process_outstanding_index')
    @patch('core.functions.file_upload_trigger.Blob.from_data')
    def test_main(self, blob, poi):
        """
        Trivial test for file upload trigger
        """
        main(is_patch)
        poi.assert_called
        dac_patch.assert_called()
        dip_patch.assert_called()
        akc_patch.assert_called()
        aoie_patch.assert_called()
        as_patch.assert_called()
        blob.assert_called()

    @patch('core.functions.file_upload_trigger.process_outstanding_index')
    @patch('core.functions.file_upload_trigger.Blob.from_data')
    def test_search_index_splicing(self, _blob, _poi):
        """
        Tests the splicing of the search index name from the blob name
        """
        is_patch.name = \
            "document-storage/2788c990-9822-11ee-8918-5dab27c25f8c"
        main(is_patch)
        as_patch.assert_called()
        self.assertEqual(as_patch.call_args.kwargs['index_name'],
                         "2788c990-9822-11ee-8918-5dab27c25f8c")

    @patch('core.functions.file_upload_trigger.send_file_processed_mail')
    @patch('models.pending_uploads.PendingUploadsDAO.delete_for_filename')
    def test_process_outstanding_index_done(self,
                                            delete_for_filename_mock,
                                            send_file_processed_mail_mock):
        """
        Processes an outstanding index that is done.
        """
        process_outstanding_index(self.model)

        send_file_processed_mail_mock.assert_called_once_with(
            'mock_server', 'mock_username', 'mock_password', 'mock_url',
            'test.pdf', 'test', 'test@example.com', None)
        delete_for_filename_mock.assert_called_once_with(
            db_session_patch.return_value, 'test.pdf')
