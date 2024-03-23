"""Azure Function to move vectors from validation to production index"""

import logging

from azure.core.exceptions import HttpResponseError
from azure.functions import HttpRequest, HttpResponse
from azure.search.documents.indexes.models import (HnswAlgorithmConfiguration,
                                                   SearchableField,
                                                   SearchField,
                                                   SearchFieldDataType,
                                                   SearchIndex, SimpleField,
                                                   VectorSearch,
                                                   VectorSearchProfile)
from utils.services import Services


def create_index(index_name: str) -> None:
    """
    Create an index in the search service

    Args:
        index_name (str): The name of the index to create
    """
    fields = [
        SimpleField(name="id",
                    type=SearchFieldDataType.String,
                    key=True,
                    sortable=True,
                    filterable=True,
                    facetable=True),

        SearchableField(name="content",
                        sortable=True,
                        filterable=True,
                        facetable=True),

        SearchField(
            name="content_vector",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            vector_search_dimensions=1536,
            vector_search_profile_name="my-vector-config"),

        SimpleField(name="metadata",
                    type=SearchFieldDataType.String,
                    sortable=True,
                    filterable=False,
                    facetable=False),

        SimpleField(name="filepath",
                    type=SearchFieldDataType.String,
                    sortable=True,
                    filterable=True,
                    facetable=False),
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

    Services().document_cognitive_search_index.create_index(
        SearchIndex(name=index_name, fields=fields,
                    vector_search=vector_search)
    )


def check_index_exists(index_name: str) -> bool:
    """Check if an index exists in the search service"""
    index_names = list(
        Services().document_cognitive_search_index.list_index_names())
    return index_name in index_names


def migrate_documents(validation_index_name: str,
                      production_index_name: str) -> None:
    """Migrate documents from validation to production index"""
    validation_index_client = Services().document_cognitive_search_index.\
        get_search_client(
            index_name=validation_index_name
        )

    production_client = Services().document_cognitive_search_index.\
        get_search_client(
            index_name=production_index_name
        )

    for page in validation_index_client.search(search_text="*").by_page():
        documents = list(page)
        for doc in documents:
            doc['filepath'] = f'{validation_index_name}.pdf'

        logging.info(documents)
        production_client.upload_documents(documents)


def move_document_to_production(name: str) -> None:
    """
    Moves a document from the validation storage container to production
    """
    source_client = Services().validation_container_client.get_blob_client(
        name)
    target_client = Services().production_container_client.get_blob_client(
        f'{name}.pdf')

    target_client.start_copy_from_url(source_client.url)
    source_client.delete_blob()


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

    validation_index_name = req_body.get('validation_index_name')
    production_index_name = req_body.get('production_index_name')

    if not check_index_exists(validation_index_name):
        return index_not_found_error(validation_index_name)

    if not check_index_exists(production_index_name):
        create_index(production_index_name)

    migrate_documents(validation_index_name, production_index_name)

    try:
        Services().document_cognitive_search_index.delete_index(
            validation_index_name)
        move_document_to_production(validation_index_name)
    except HttpResponseError as err:
        return error_deleting_index(err)

    return HttpResponse(
        "Documents moved to production index with filepath added",
        status_code=200
    )
