"""
Utilities for image processing.
"""

from io import BytesIO

from PIL import Image


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
