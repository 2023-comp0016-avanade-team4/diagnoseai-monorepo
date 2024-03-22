"""
Triggers upon an upload to the verification document storage
"""
import logging

from azure.functions import InputStream
from langchain.document_loaders.blob_loaders import Blob
# NOTE: The warning is invalid. DocumentIntelligenceLoader only
# accepts a filepath; we're working directly with blobs here.
from langchain_community.document_loaders.pdf import DocumentIntelligenceParser
from langchain_community.vectorstores.azuresearch import AzureSearch
from models.pending_uploads import PendingUploadsDAO, PendingUploadsModel
from utils.secrets import Secrets
from utils.services import Services
from utils.smtp_send_mail import send_file_processed_mail


def process_outstanding_index(model: PendingUploadsModel) -> None:
    """
    Processes an outstanding index.

    Args:
        model (PendingUploadsModel): The model to process
    """
    secrets = Secrets()
    send_file_processed_mail(
        secrets.get("SMTPServer"),
        secrets.get("SMTPUsername"),
        secrets.get("SMTPPassword"),
        secrets.get("UploaderBaseURL"),
        model.filename,
        model.username,
        model.user_email,
        model.machine_id)
    PendingUploadsDAO.delete_for_filename(
        Services().db_session, model.filename)


def main(blob: InputStream):
    """
    Entrypoint to process blob storage event
    """
    assert blob.name is not None
    search_index = blob.name.split('/')[-1]

    logging.info("Index name: %s", search_index)

    loader = DocumentIntelligenceParser(client=Services().document_analysis,
                                        model='prebuilt-document')
    secrets = Secrets()
    vector_store = AzureSearch(
        azure_search_endpoint=secrets.get("CognitiveSearchEndpoint"),
        azure_search_key=secrets.get("CognitiveSearchKey"),
        index_name=search_index,
        embedding_function=Services().embeddings.embed_query
    )
    documents = loader.lazy_parse(Blob.from_data(blob.read()))
    logging.info('Sending to vector store...')
    vector_store.add_documents(documents=list(documents))

    model = PendingUploadsDAO.get_pending_uploads_on_filename(
        Services().db_session, search_index)

    if model:
        logging.info('Telling associated email that index is processed')
        process_outstanding_index(model)

if __name__ == '__main__':
    main()
