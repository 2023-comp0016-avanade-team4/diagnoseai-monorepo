import os
import unittest
from unittest.mock import Mock, MagicMock, patch

#Globals patching 
aoie_patch = patch('langchain.embeddings.AzureOpenAIEmbeddings').start()
as_patch = patch('langchain.vectorstores.azuresearch.AzureSearch').start()
cts_patch = patch('langchain.text_splitter.CharacterTextSplitter').start()
environ_patch = patch.dict(os.environ, {"CognitiveSearchKey": "mock_key", "CognitiveSearchEndpoint": "mock_endpoint", "OpenAIKey": "mock_key", "OpenAIEndpoint": "mock_endpoint"}).start()

from core.utils.vectorise_text import vectoriseImageSummary



class TestImageSummaryVectorisation(unittest.TestCase):

    def test_vectoriseImageSummary(self):
        imageSummary = ""
        vectorIndex = "" 
        vectoriseImageSummary(imageSummary, vectorIndex)
        aoie_patch.assert_called()
        as_patch.assert_called()
        cts_patch.assert_called()

