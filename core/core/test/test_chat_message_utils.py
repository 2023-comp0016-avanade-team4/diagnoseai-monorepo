"""
Tests some functions from the chat_message utils
"""
from unittest.mock import patch

from core.models.chat_message import Citation
from core.utils.chat_message import translate_citation_urls

from base_test_case import BaseTestCase


class TestChatMessageUtils(BaseTestCase):
    """
    Tests the chat message utils
    """
    @patch('core.utils.chat_message.get_preauthenticated_blob_url',
           return_value='ret')
    @patch('azure.storage.blob.BlobServiceClient')
    def test_translate_citation_urls(self, bsc, gpbu):
        """
        Tests the translation of citation urls
        """
        citations = [
            Citation(
                title='',
                url='',
                chunk_id='',
                content='hello',
                filepath='testing'
            )
        ]
        translated_citation = translate_citation_urls(citations, bsc,
                                                      'nomatter')
        gpbu.assert_called()
        self.assertEqual(translated_citation[0].filepath, 'ret')
