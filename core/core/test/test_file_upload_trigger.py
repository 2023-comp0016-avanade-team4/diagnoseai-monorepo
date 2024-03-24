""" Tests the blob trigger function """
from unittest.mock import MagicMock, patch

from core.functions.file_upload_trigger import (main,  # noqa: E402
                                                process_outstanding_index)
from core.models.pending_uploads import PendingUploadsModel

from base_test_case import BaseTestCase


# The test functions uses the decorators, which has many arguments
# because it is necessary. Invalid lint.
# pylint: disable=too-many-arguments
class TestFileUploadTrigger(BaseTestCase):
    """
    Class to test file upload trigger
    """
    @classmethod
    def setUpClass(cls):
        cls.secrets_and_services_mock('core.functions.file_upload_trigger')

    def setUp(self):
        self.model = PendingUploadsModel(
            upload_id='test_id',
            filename='test.pdf',
            username='test',
            user_email='test@example.com')

    @patch('core.functions.file_upload_trigger.PendingUploadsDAO')
    @patch('core.functions.file_upload_trigger.AzureSearch')
    @patch('core.functions.file_upload_trigger.DocumentIntelligenceParser')
    @patch('core.functions.file_upload_trigger.process_outstanding_index')
    @patch('core.functions.file_upload_trigger.Blob.from_data')
    def test_main(self, blob, poi, dip_patch, as_patch, pud_patch):
        """
        Trivial test for file upload trigger
        """
        main(MagicMock())
        poi.assert_called()
        dip_patch.assert_called()
        as_patch.assert_called()
        blob.assert_called()
        pud_patch.get_pending_uploads_on_filename.assert_called()

    @patch('core.functions.file_upload_trigger.AzureSearch')
    @patch('core.functions.file_upload_trigger.process_outstanding_index')
    @patch('core.functions.file_upload_trigger.Blob.from_data')
    def test_search_index_splicing(self, _blob, _poi, as_patch):
        """
        Tests the splicing of the search index name from the blob name
        """
        is_spec = MagicMock()
        is_spec.name = \
            "document-storage/2788c990-9822-11ee-8918-5dab27c25f8c"
        main(is_spec)
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
        db_session_patch = self.services_mock.return_value.db_session
        secrets_mapping = {
            'SMTPServer': 'mock_server',
            'SMTPUsername': 'mock_username',
            'SMTPPassword': 'mock_password',
            'UploaderBaseURL': 'mock_url'
        }
        self.secrets_mock.return_value.get.side_effect = \
            lambda x: secrets_mapping[x]
        process_outstanding_index(self.model)

        send_file_processed_mail_mock.assert_called_once_with(
            'mock_server', 'mock_username', 'mock_password', 'mock_url',
            'test.pdf', 'test', 'test@example.com', None)
        delete_for_filename_mock.assert_called_once_with(
            db_session_patch, 'test.pdf')

        # reset for other tests
        self.secrets_mock.return_value.get.side_effect = None
