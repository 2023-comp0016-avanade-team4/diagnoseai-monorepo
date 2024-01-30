"""
Test the image summary vectorisation function
"""
import os
import unittest
from unittest.mock import  patch

#Globals patching
aoie_patch = patch('langchain.embeddings.AzureOpenAIEmbeddings').start()
as_patch = patch('langchain.vectorstores.azuresearch.AzureSearch').start()
cts_patch = patch('langchain.text_splitter.CharacterTextSplitter').start()
environ_patch = patch.dict(os.environ, {
    "CognitiveSearchKey": "mock_key",
    "CognitiveSearchEndpoint": "mock_endpoint",
    "OpenAIKey": "mock_key",
    "OpenAIEndpoint": "mock_endpoint"
    }).start()

from core.utils.vectorise_text import vectorise_image_summary



class TestImageSummaryVectorisation(unittest.TestCase):
    """
        Tests the image summary vectorisation function
    """
    def test_vectorise_image_summary(self):
        """
        Trivial test for vectorise_image_summary
        """
        image_summary = ""
        vector_index = "" 
        vectorise_image_summary(image_summary, vector_index)
        aoie_patch.assert_called()
        as_patch.assert_called()
        cts_patch.assert_called()
