"""
Utilities for image processing.
"""

import base64
import logging
from datetime import timedelta, datetime
from io import BytesIO

import puremagic  # type: ignore[import-untyped]
from azure.storage.blob import (BlobSasPermissions, BlobServiceClient,
                                generate_blob_sas)
from PIL import Image


def is_url_encoded_image(body: str) -> bool:
    """
    Checks if the image is a URL encoded image.
    """
    if not body.startswith('data:image/') or ',' not in body:
        return False

    decoded = base64.b64decode(body.split(',')[1])
    magic_detection = puremagic.magic_string(decoded)
    return not len(magic_detection) == 0 and \
        magic_detection[0].mime_type.startswith('image')


def __resize_if_needed(img: Image.Image, max_width: int) -> Image.Image:
    width, height = img.size
    if width <= max_width:
        return img

    aspect_ratio = height / width
    new_height = int(max_width * aspect_ratio)
    return img.resize((max_width, new_height))


def compress_image(content: bytes, resized_width: int = 600) -> bytes:
    """
    Calls a library to resize then compress the content.

    Args:
        content (bytes): Content to compress

    Returns:
        bytes: The compressed image
    """
    # doing it this way because we want PIL to infer the image, and also
    # automatically compress the image when saving
    img_stream = BytesIO(content)
    out_stream = BytesIO()
    __resize_if_needed(Image.open(img_stream).convert('RGB'),
                       resized_width).save(out_stream, format='JPEG')
    return out_stream.getvalue()
