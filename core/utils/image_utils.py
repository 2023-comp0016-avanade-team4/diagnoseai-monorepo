"""
Utilities for image processing.
"""

import base64
import logging
from datetime import timedelta, datetime
from io import BytesIO

import puremagic
from azure.storage.blob import (BlobSasPermissions, BlobServiceClient,
                                generate_blob_sas)
from PIL import Image


def get_preauthenticated_blob_url(blob_service_client: BlobServiceClient,
                                  container_name: str,
                                  filename: str) -> str:
    """
    Gets a pre-authenticated URL from the image blob container

    Args:
        filename (str): Filename to get the URL for
    """
    logging.info("Obtaining pre-authenticated image URL for %s", filename)

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
    return f"{blob_client.url}/{sas_token}"


def is_url_encoded_image(body: str) -> bool:
    if not body.startswith('data:image/') or ',' not in body:
        return False

    decoded = base64.b64decode(body.split(',')[1])
    magic_detection = puremagic.magic_string(decoded)
    return not len(magic_detection) == 0 and \
        magic_detection[0].mime_type.startswith('image')


def compress_image(content: bytes) -> bytes:
    """
    Calls a library to compress the content.

    Args:
        content (bytes): Content to compress

    Returns:
        bytes: The compressed image
    """
    # doing it this way because we want PIL to infer the image, and also
    # automatically compress the image when saving
    img_stream = BytesIO(content)
    out_stream = BytesIO()
    Image.open(img_stream).convert('RGB').save(out_stream, format='JPEG')
    return out_stream.getvalue()
