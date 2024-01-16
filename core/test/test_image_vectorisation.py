import os
import unittest
from unittest.mock import Mock, MagicMock, patch

#Globals patching 
aoi_patch = patch('openai.AzureOpenAI').start()
aoie_patch = patch('langchain.embeddings.AzureOpenAIEmbeddings').start()
as_patch = patch('langchain.vectorstores.azuresearch.AzureSearch').start()
cts_patch = patch('langchain.text_splitter.CharacterTextSplitter').start()
post_patch = patch('requests.post').start()

loads_patch = patch('json.loads').start()

from core.imageVectorisation.__init__ import vectoriseImage

class TestImageVectorisation(unittest.TestCase):

    def test_vectoriseImage(self):
        image_url = ""
        vectorIndex = "" 
        mock_response = { 'text' : "{'choices': [{'message': {'content': 'mock_content'}}]}"}
        requests.post.return_value = Mock(**mock_response)
        vectoriseImage(image_url, vectorIndex)
        aoi_patch.assert_called()
        aoie_patch.assert_called()
        as_patch.assert_called()
        cts_patch.assert_called()
        post_patch.assert_called()
        loads_patch.assert_called()

