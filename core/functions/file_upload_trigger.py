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

from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from models.pending_uploads import PendingUploadsDAO, PendingUploadsModel
from utils.db import create_session
from utils.smtp_send_mail import send_file_processed_mail

# Loading required variables from the environment

DOCUMENT_ENDPOINT = os.environ["DocumentEndpoint"]
DOCUMENT_KEY = os.environ["DocumentKey"]
DOCUMENT_CREDENTIAL = AzureKeyCredential(DOCUMENT_KEY)

OPENAI_KEY = os.environ["OpenAIKey"]
OPENAI_ENDPOINT = os.environ["OpenAIEndpoint"]

os.environ["AZURE_OPENAI_API_KEY"] = OPENAI_KEY
os.environ["AZURE_OPENAI_ENDPOINT"] = OPENAI_ENDPOINT

SMTP_SERVER = os.environ["SMTPServer"]
SMTP_USERNAME = os.environ["SMTPUsername"]
SMTP_PASSWORD = os.environ["SMTPPassword"]

UPLOADER_BASE_URL = os.environ["UploaderBaseURL"]

SEARCH_KEY = os.environ["CognitiveSearchKey"]
SEARCH_ENDPOINT = os.environ["CognitiveSearchEndpoint"]
SEARCH_CREDENTIAL = AzureKeyCredential(SEARCH_KEY)

DATABASE_URL = os.environ['DatabaseURL']
DATABASE_NAME = os.environ['DatabaseName']
DATABASE_USERNAME = os.environ['DatabaseUsername']
DATABASE_PASSWORD = os.environ['DatabasePassword']
DATABASE_SELFSIGNED = os.environ.get('DatabaseSelfSigned')

# Global clients

document_client = DocumentAnalysisClient(endpoint=DOCUMENT_ENDPOINT,
                                         credential=DOCUMENT_CREDENTIAL)

embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-ada-002",
    api_version="2023-05-15",
)

search_client = SearchIndexClient(endpoint=SEARCH_ENDPOINT,
                                  credential=SEARCH_CREDENTIAL)

db_session = create_session(
    DATABASE_URL, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD,
    bool(DATABASE_SELFSIGNED)
)


def process_outstanding_index(model: PendingUploadsModel) -> None:
    """
    Processes an outstanding index.

    Args:
        model (PendingUploadsModel): The model to process
    """
    send_file_processed_mail(
        SMTP_SERVER,
        SMTP_USERNAME,
        SMTP_PASSWORD,
        UPLOADER_BASE_URL,
        model.filename,
        model.username,
        model.user_email,
        model.machine_id)
    PendingUploadsDAO.delete_for_filename(db_session, model.filename)


def main(blob: InputStream):
    """
    Entrypoint to process blob storage event
    """
    search_index = blob.name.split('/')[-1]

    logging.info(f"Index name: %s \n", search_index)

    loader = DocumentIntelligenceParser(client=document_client,
                                        model='prebuilt-document')
    vector_store = AzureSearch(
        azure_search_endpoint=SEARCH_ENDPOINT,
        azure_search_key=SEARCH_KEY,
        index_name=search_index,
        embedding_function=embeddings.embed_query
    )
    documents = loader.lazy_parse(Blob.from_data(blob.read()))
    logging.info('Sending to vector store...')
    vector_store.add_documents(documents=list(documents))

    model = PendingUploadsDAO.get_pending_uploads_on_filename(
        db_session, search_index)

    if model:
        logging.info('Telling associated email that index is processed')
        process_outstanding_index(model)
