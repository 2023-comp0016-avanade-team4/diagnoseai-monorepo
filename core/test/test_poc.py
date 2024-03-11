"""
Tests the proof of concept function
"""

import os
import unittest
from unittest.mock import MagicMock, patch

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
blob_patch = \
    patch('langchain.document_loaders.blob_loaders.schema.Blob.from_data') \
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


class TestProofOfConcept(unittest.TestCase):
    """
    Tests the proof of concept function (trivial test)
    """
    def test_blob_trigger(self):
        """
        Invokes a false blob trigger
        """
        fake_input_stream = MagicMock()
        # TODO: Preserved for our eventual transition to V2
        # main.build().get_user_function()(fake_input_stream)
        main(fake_input_stream)
        dip_patch.assert_called_once_with(client=document_client,
                                          model='prebuilt-document')
        as_patch.assert_called_once()
