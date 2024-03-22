"""
Utilities for AI Search.
"""

import logging
from azure.search.documents.indexes import SearchIndexClient
from azure.core.exceptions import ResourceNotFoundError


def is_index_ready(search_index: str,
                   index_client: SearchIndexClient) -> bool:
    """
    Checks if a search index is ready.

    Args:
        search_index (str): The search index
        index_client (SearchIndexClient): The search index client

    Returns:
        bool: True if the index is ready, False if not
    """
    logging.info('Checking if index %s is ready', search_index)
    try:
        index_client.get_index(search_index)
        document_count = index_client.get_index_statistics(
            search_index).get('document_count')
        assert isinstance(document_count, int)
        logging.info('%s found. Document count: %d', search_index,
                     document_count)
        return document_count > 0
    except ResourceNotFoundError:
        logging.error('%s not found. Reporting as not ready.', search_index)
        return False
    except KeyError:
        logging.error('Document count not found. Reporting as not ready.')
        return False
    except AssertionError:
        logging.error(
            'Document count is not an integer. Reporting as not ready.')
        return False
