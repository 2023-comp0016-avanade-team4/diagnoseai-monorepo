import logging
import os

from azure.functions import InputStream
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

# Global clients

document_client = DocumentAnalysisClient(endpoint=DOCUMENT_ENDPOINT,
                                         credential=DOCUMENT_CREDENTIAL)

embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-ada-002",
    api_version="2023-05-15",
)



def main(myblob: InputStream):
    logging.info(f"Python blob trigger function processed blob \n"
                 f"Name: {myblob.name}\n"
                 f"Blob Size: {myblob.length} bytes")
    
    SEARCH_INDEX = myblob.name[myblob.name.find('/') + 1:53]

    logging.info(f"Index name: {SEARCH_INDEX} \n")

    loader = DocumentIntelligenceParser(client=document_client,
                                        model='prebuilt-document')
    vector_store = AzureSearch(
        azure_search_endpoint=SEARCH_ENDPOINT,
        azure_search_key=SEARCH_KEY,
        index_name=SEARCH_INDEX,
        embedding_function=embeddings.embed_query
    )
    documents = loader.lazy_parse(Blob.from_data(myblob.read()))
    logging.info('Sending to vector store...')
    vector_store.add_documents(documents=list(documents))
