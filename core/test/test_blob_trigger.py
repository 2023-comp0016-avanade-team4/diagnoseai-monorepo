""" Tests the blob trigger function """
import os
import unittest
from unittest.mock import patch

#Globals patching


dac_patch = patch('azure.ai.formrecognizer.DocumentAnalysisClient').start()
dip_patch = patch('langchain.document_loaders.pdf.DocumentIntelligenceParser').start()
akc_patch = patch('azure.core.credentials.AzureKeyCredential').start()
aoie_patch = patch('langchain.embeddings.AzureOpenAIEmbeddings').start()
as_patch = patch('langchain.vectorstores.azuresearch.AzureSearch').start()
is_patch = patch('azure.functions.InputStream').start()

#Environment patching

environ_patch = patch.dict(os.environ, {
    "CognitiveSearchKey": "mock_key",
    "CognitiveSearchEndpoint": "mock_endpoint",
    "OpenAIKey": "mock_key",
    "OpenAIEndpoint": "mock_endpoint",
    "DocumentEndpoint" : "mock_endpoint",
    "DocumentKey" : "mock_key"
    }).start()

from core.fileUploadTrigger import main


class TestFileUploadTrigger(unittest.TestCase):
    """ Class to test file upload trigger """
    def test_main(self):
        """ Trivial test for file upload trigger """
        main(is_patch)
        dac_patch.assert_called()
        dip_patch.assert_called()
        akc_patch.assert_called()
        aoie_patch.assert_called()
        as_patch.assert_called()

    def test_search_index_splicing(self):
        """ Tests the splicing of the search index name from the blob name"""
        is_patch.name = "document-storage/2788c990-9822\
                -11ee-8918-5dab27c25f8cAadhik_Easwar_Resume.pdf"
        main(is_patch)
        as_patch.assert_called()
        self.assertEqual(as_patch.call_args.kwargs['index_name'],
                "2788c990-9822-11ee-8918-5dab27c25f8c")
