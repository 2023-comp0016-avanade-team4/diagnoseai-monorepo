"""Azure Function to move vectors from validation to production index"""

import os
import logging

from azure.functions import HttpRequest, HttpResponse
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError
from azure.search.documents.indexes.models import (
    SearchFieldDataType,
    SimpleField,
    SearchableField,
    SearchIndex,
    SearchField,
    VectorSearch,
    VectorSearchProfile,
    HnswAlgorithmConfiguration
)

from utils.verify_token import verify_token

# Environment Variables

COGNITIVE_SERVICE_ENDPOINT = os.environ["CognitiveSearchEndpoint"]
COGNITIVE_SEARCH_API_KEY = os.environ["CognitiveSearchKey"]

# Global Clients

credential = AzureKeyCredential(COGNITIVE_SEARCH_API_KEY)

cognitiveSearchClient = SearchIndexClient(
    endpoint=COGNITIVE_SERVICE_ENDPOINT,
    credential=credential
)


def create_index(index_name: str) -> None:
    """Create an index in the search service"""
    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True, sortable=True, filterable=True, facetable=True),
        SearchableField(name="content", sortable=True, filterable=True, facetable=True),
        SearchField(name="content_vector", type=SearchFieldDataType.Collection(SearchFieldDataType.Single), searchable=True, vector_search_dimensions=1536, vector_search_profile_name="my-vector-config"),
        SimpleField(name="metadata", type=SearchFieldDataType.String, sortable=True, filterable=False, facetable=False),
        SimpleField(name="filepath", type=SearchFieldDataType.String, sortable=True, filterable=True, facetable=False),
    ]

    vector_search = VectorSearch(
        profiles=[
            VectorSearchProfile(
                name='my-vector-config',
                algorithm_configuration_name='my-algorithms-config'
            )
        ],
        algorithms=[HnswAlgorithmConfiguration(name='my-algorithms-config')]
    )

    cognitiveSearchClient.create_index(
        SearchIndex(name=index_name, fields=fields, vector_search=vector_search)
    )


def check_index_exists(index_name: str) -> bool:
    """Check if an index exists in the search service"""
    index_names = list(cognitiveSearchClient.list_index_names())
    return index_name in index_names


def migrate_documents(validation_index_name: str,
                      production_index_name: str) -> None:
    """Migrate documents from validation to production index"""
    validation_index_client = SearchClient(
        endpoint=COGNITIVE_SERVICE_ENDPOINT,
        index_name=validation_index_name,
        credential=credential
    )

    production_client = SearchClient(
        endpoint=COGNITIVE_SERVICE_ENDPOINT,
        index_name=production_index_name,
        credential=credential
    )

    for page in validation_index_client.search(search_text="*").by_page():
        documents = list(page)
        for doc in documents:
            doc['filepath'] = validation_index_name

        logging.info(documents)
        production_client.upload_documents(documents)


def index_not_found_error(validation_index_name: str) -> HttpResponse:
    """Return a response indicating that the validation index was not found"""
    return HttpResponse(
        f"Validation index {validation_index_name} not found",
        status_code=404
    )


def error_deleting_index(err: HttpResponseError) -> HttpResponse:
    """Return a response indicating that there was an error deleting
    the validation index"""
    return HttpResponse(
        f"Error deleting validation index: {err.message}",
        status_code=500
    )


def main(req: HttpRequest) -> HttpResponse:
    """Azure Function to move vectors from validation to production index"""
    req_body = req.get_json()

    # Ensure that the sender is authorized to make this request
    if not verify_token(req.headers['Auth-Token']):
        return HttpResponse(
            "Unauthorized",
            status_code=401
        )

    validation_index_name = req_body.get('validation_index_name')
    production_index_name = req_body.get('production_index_name')

    if not check_index_exists(validation_index_name):
        return index_not_found_error(validation_index_name)

    if not check_index_exists(production_index_name):
        create_index(production_index_name)

    migrate_documents(validation_index_name, production_index_name)

    try:
        cognitiveSearchClient.delete_index(validation_index_name)
    except HttpResponseError as err:
        return error_deleting_index(err)

    return HttpResponse(
        "Documents moved to production index with filepath added",
        status_code=200
    )
