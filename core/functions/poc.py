"""
Temporary script to load a file & store embeddings into cloud search
"""

import logging
import os

import azure.functions as func
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from langchain.document_loaders.blob_loaders import Blob
from langchain.document_loaders.pdf import DocumentIntelligenceParser
from langchain.embeddings import AzureOpenAIEmbeddings
from langchain.vectorstores.azuresearch import AzureSearch

# Loading required variables from the environment

DOCUMENT_ENDPOINT = os.environ["DocumentEndpoint"]
DOCUMENT_KEY = os.environ["DocumentKey"]
DOCUMENT_CREDENTIAL = AzureKeyCredential(DOCUMENT_KEY)

OPENAI_KEY = os.environ["OpenAIKey"]
OPENAI_ENDPOINT = os.environ["OpenAIEndpoint"]

os.environ["AZURE_OPENAI_API_KEY"] = OPENAI_KEY
os.environ["AZURE_OPENAI_ENDPOINT"] = OPENAI_ENDPOINT

SEARCH_KEY = os.environ["CognitiveSearchKey"]
SEARCH_ENDPOINT = os.environ["CognitiveSearchEndpoint"]
SEARCH_INDEX = 'validation-index'

# Global clients

document_client = DocumentAnalysisClient(endpoint=DOCUMENT_ENDPOINT,
                                         credential=DOCUMENT_CREDENTIAL)

embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-ada-002",
    api_version="2023-05-15",
)

vector_store = AzureSearch(
    azure_search_endpoint=SEARCH_ENDPOINT,
    azure_search_key=SEARCH_KEY,
    # TODO: Technically, each instance of an upload for validation
    # should have their own search index.
    index_name=SEARCH_INDEX,
    embedding_function=embeddings.embed_query
)


def main(blob: func.InputStream) -> None:
    """
    Analyzer entrypoint. For every supported file uploaded, sends it
    through the DocumentAnalyzer, gets an embedding, and then dumps it
    into Cognitive Search.
    """
    loader = DocumentIntelligenceParser(client=document_client,
                                        model='prebuilt-document')
    documents = loader.lazy_parse(Blob.from_data(blob.read()))
    logging.info('Sending to vector store...')
    vector_store.add_documents(documents=list(documents))