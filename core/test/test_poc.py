"""
Tests the proof of concept function
"""

import os
import unittest
from unittest.mock import MagicMock, patch
from base_test_case import BaseTestCase

# Globals patching
dip_patch = \
    patch('langchain.document_loaders.pdf.DocumentIntelligenceParser') \
    .start()
dac_patch = patch('azure.ai.formrecognizer.DocumentAnalysisClient') \
    .start()
aoae_patch = patch('langchain.embeddings.AzureOpenAIEmbeddings') \
    .start()
as_patch = patch('langchain.vectorstores.azuresearch.AzureSearch') \
    .start()

os.environ["DocumentEndpoint"] = ''
os.environ["DocumentKey"] = ''
os.environ["OpenAIKey"] = ''
os.environ["OpenAIEndpoint"] = ''
os.environ["CognitiveSearchKey"] = ''
os.environ["CognitiveSearchEndpoint"] = ''

# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.functions.poc import main, document_client  # noqa: E402


class TestProofOfConcept(BaseTestCase):
    """
    Tests the proof of concept function (trivial test)
    """
    @patch('core.functions.poc.Blob.from_data')
    def test_blob_trigger(self, blob):
        """
        Invokes a false blob trigger
        """
        fake_input_stream = MagicMock()
        main(fake_input_stream)
        dip_patch.assert_called_once_with(client=document_client,
                                          model='prebuilt-document')
        blob.assert_called_once_with(fake_input_stream.read())
        as_patch.assert_called_once()
