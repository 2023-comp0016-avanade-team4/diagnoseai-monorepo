"""Azure Function to move vectors from validation to production index"""
import os
import logging

from azure.functions import HttpRequest, HttpResponse
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.core.credentials import AzureKeyCredential

# Get the service endpoint and API key from the environment

CognitiveSearchServiceEndpoint = os.environ["CognitiveSearchServiceEndpoint"]
CognitiveSearchApiKey = os.environ["CognitiveSearchKey"]
ProductionIndexName = os.environ["ProductionIndexName"]

# Create a client

credential = AzureKeyCredential(CognitiveSearchApiKey)

productionClient = SearchClient(
    endpoint=CognitiveSearchServiceEndpoint,
    index_name=ProductionIndexName,
    credential=credential
)

cognitiveSearchClient = SearchIndexClient(
    endpoint=CognitiveSearchServiceEndpoint,
    credential=credential
)


def main(req: HttpRequest) -> HttpResponse:
    """Azure Function to move vectors from validation to production index"""
    req_body = req.get_json()

    # Create validation index client
    validation_index_name = req_body.get('validationIndexName')
    validation_index_client = SearchClient(
        endpoint=CognitiveSearchServiceEndpoint,
        index_name=validation_index_name,
        credential=credential
    )

    # Get the documents from the validation index
    documents: list[dict] = list(
        list(*validation_index_client.search(search_text="*").by_page())
    )
    logging.info(documents)

    # Upload documents to production index
    productionClient.upload_documents(documents)

    # Delete validation index
    cognitiveSearchClient.delete_index(validation_index_name)

    return HttpResponse(
        "Documents moved to production index",
        status_code=200
    )
