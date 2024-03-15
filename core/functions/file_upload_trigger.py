"""
Triggers upon an upload to the verification document storage
"""
import logging
import os

import azure.functions as func
from azure.functions import InputStream
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from langchain.document_loaders.blob_loaders import Blob
from langchain_community.document_loaders.pdf import DocumentIntelligenceParser
from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.vectorstores.azuresearch import AzureSearch

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

# Global clients

document_client = DocumentAnalysisClient(endpoint=DOCUMENT_ENDPOINT,
                                         credential=DOCUMENT_CREDENTIAL)

embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-ada-002",
    api_version="2023-05-15",
)


def main(blob: InputStream):
    """
    Entrypoint to process blob storage event
    """
    logging.info("Python blob trigger function processed blob \n"
                 "Name: %s\n"
                 "Blob Size: %d bytes", blob.name, blob.length)

    SEARCH_INDEX = blob.name.split('/')[-1]

    logging.info(f"Index name: %s \n", SEARCH_INDEX)

    loader = DocumentIntelligenceParser(client=document_client,
                                        model='prebuilt-document')
    vector_store = AzureSearch(
        azure_search_endpoint=SEARCH_ENDPOINT,
        azure_search_key=SEARCH_KEY,
        index_name=SEARCH_INDEX,
        embedding_function=embeddings.embed_query
    )
    documents = loader.lazy_parse(Blob.from_data(blob.read()))
    logging.info('Sending to vector store...')
    vector_store.add_documents(documents=list(documents))
