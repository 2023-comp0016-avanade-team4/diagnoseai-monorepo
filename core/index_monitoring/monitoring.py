"""
This function runs every X minutes (check function.json) to monitor AI
search indexes.

Connects to the database; if the indexes have been processed, an email
is sent to the user.

Assertions:
- The index name of the AI Search Index is equal to the filename
- The document uploaded does not have zero vectors
"""

import datetime
import logging
import os

import azure.functions as func
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from models.pending_uploads import PendingUploadsDAO, PendingUploadsModel
from utils.db import create_session
from utils.search_utils import is_index_ready
from utils.smtp_send_mail import send_file_processed_mail

# Required environment variables

DATABASE_URL = os.environ['DatabaseURL']
DATABASE_NAME = os.environ['DatabaseName']
DATABASE_USERNAME = os.environ['DatabaseUsername']
DATABASE_PASSWORD = os.environ['DatabasePassword']
DATABASE_SELFSIGNED = os.environ.get('DatabaseSelfSigned')

SEARCH_KEY = os.environ["CognitiveSearchKey"]
SEARCH_ENDPOINT = os.environ["CognitiveSearchEndpoint"]
SEARCH_CREDENTIAL = AzureKeyCredential(SEARCH_KEY)

SMTP_SERVER = os.environ["SMTPServer"]
SMTP_USERNAME = os.environ["SMTPUsername"]
SMTP_PASSWORD = os.environ["SMTPPassword"]

UPLOADER_BASE_URL = os.environ["UploaderBaseURL"]

# Global clients

db_session = create_session(
    DATABASE_URL, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD,
    bool(DATABASE_SELFSIGNED)
)

search_client = SearchIndexClient(endpoint=SEARCH_ENDPOINT,
                                  credential=SEARCH_CREDENTIAL)


def process_outstanding_index(model: PendingUploadsModel) -> None:
    """
    Processes an outstanding index.

    Args:
        model (PendingUploadsModel): The model to process
    """
    if not is_index_ready(model.filename, search_client):
        return

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


def main(ticker: func.TimerRequest) -> None:  # pylint: disable=unused-argument
    """
    Entrypoint to this function. The timer request comes from Azure

    Unusued argument, which is required because function.json specified it.
    """
    utc_timestamp = datetime.datetime.now().isoformat()
    logging.info('Scheduled function now checking indexes %s', utc_timestamp)
    list(map(process_outstanding_index,
             PendingUploadsDAO.get_all_unprocessed_filenames(db_session)))
    logging.info('Scheduled function finished checking indexes')
