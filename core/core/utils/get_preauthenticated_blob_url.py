"""
Utility for preauthenticated url's from blob storage.
"""

import logging
from datetime import timedelta, datetime

from azure.storage.blob import (BlobSasPermissions, BlobServiceClient,
                                generate_blob_sas)


def get_preauthenticated_blob_url(blob_service_client: BlobServiceClient,
                                  container_name: str,
                                  filename: str) -> str:
    """
    Gets a pre-authenticated URL from the blob container

    Args:
        filename (str): Filename to get the URL for
    """
    logging.info("Obtaining pre-authenticated URL for %s", filename)

    blob_client = blob_service_client.get_blob_client(
        container_name, filename)

    sas_token = generate_blob_sas(
        account_name=blob_client.account_name,
        container_name=blob_client.container_name,
        blob_name=blob_client.blob_name,
        account_key=blob_client.credential.account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(hours=1)
    )
    return f"{blob_client.url}?{sas_token}"
