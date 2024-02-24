"""
Tests the index monitoring function
"""
import os
import unittest
from unittest.mock import patch

import azure.functions as func  # type: ignore[import-untyped]
from core.models.pending_uploads import PendingUploadsModel

# Globals patching
db_session_patch = patch('utils.db.create_session') \
    .start()
sc_patch = patch('azure.search.documents.indexes.SearchIndexClient') \
    .start()

os.environ['DatabaseURL'] = ''
os.environ['DatabaseName'] = ''
os.environ['DatabaseUsername'] = ''
os.environ['DatabasePassword'] = ''
os.environ['CognitiveSearchKey'] = ''
os.environ['CognitiveSearchEndpoint'] = ''
os.environ['SMTPServer'] = ''
os.environ['SMTPUsername'] = ''
os.environ['SMTPPassword'] = ''
os.environ['UploaderBaseURL'] = ''

# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.index_monitoring.monitoring import (main,  # noqa: E402
                                              process_outstanding_index)


class TestIndexMonitoring(unittest.TestCase):
    """
    Tests the index monitoring function
    """
    def setUp(self):
        self.model = PendingUploadsModel(
            upload_id='test_id',
            filename='test.pdf',
            username='test',
            user_email='test@example.com')

    def tearDown(self):
        db_session_patch.reset_mock()
        sc_patch.reset_mock()

    @patch('core.index_monitoring.monitoring.is_index_ready')
    @patch('core.index_monitoring.monitoring.send_file_processed_mail')
    @patch('models.pending_uploads.PendingUploadsDAO.delete_for_filename')
    def test_process_outstanding_index_done(self,
                                            delete_for_filename_mock,
                                            send_file_processed_mail_mock,
                                            is_index_ready_mock):
        """
        Processes an outstanding index that is done.
        """
        is_index_ready_mock.return_value = True

        process_outstanding_index(self.model)

        is_index_ready_mock.assert_called_once_with('test.pdf',
                                                    sc_patch.return_value)
        send_file_processed_mail_mock.assert_called_once_with(
            '', '', '', '', 'test.pdf', 'test', 'test@example.com')
        delete_for_filename_mock.assert_called_once_with(
            db_session_patch.return_value, 'test.pdf')

    @patch('core.index_monitoring.monitoring.is_index_ready')
    @patch('core.index_monitoring.monitoring.send_file_processed_mail')
    @patch('models.pending_uploads.PendingUploadsDAO.delete_for_filename')
    def test_process_outstanding_index_not_done(self,
                                                delete_for_filename_mock,
                                                send_file_processed_mail_mock,
                                                is_index_ready_mock):
        """
        Processes an outstanding index that is not done.
        """
        is_index_ready_mock.return_value = False

        process_outstanding_index(self.model)

        is_index_ready_mock.assert_called_once_with('test.pdf',
                                                    sc_patch.return_value)
        send_file_processed_mail_mock.assert_not_called()
        delete_for_filename_mock.assert_not_called()

    @patch(
        ('models.pending_uploads.PendingUploadsDAO'
         '.get_all_unprocessed_filenames'))
    @patch('core.index_monitoring.monitoring.process_outstanding_index')
    def test_main(self,
                  process_outstanding_index_mock,
                  get_all_unprocessed_filenames_mock):
        """
        Tests the main function
        """
        get_all_unprocessed_filenames_mock.return_value = [self.model]

        main(func.Context)

        get_all_unprocessed_filenames_mock.assert_called_once_with(
            db_session_patch.return_value)
        process_outstanding_index_mock.assert_called_once_with(self.model)
