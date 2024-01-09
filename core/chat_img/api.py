"""
Images endpoint.

TODO: This endpoint should also eventually containing fetching images
from the backend to load conversation history. This can either be
here, or in chat_history. Once confirmed, please remove this TODO.
"""

import logging
import os
from tempfile import SpooledTemporaryFile
from uuid import uuid4

import azure.functions as func  # type: ignore[import-untyped]
import puremagic  # type: ignore[import-untyped]
from azure.storage.blob import BlobServiceClient
from utils.image_utils import compress_image

IMAGE_BLOB_CONNECTION_STRING = os.environ["ImageBlobConnectionString"]
IMAGE_BLOB_CONTAINER = os.environ["ImageBlobContainer"]

blob_service_client = BlobServiceClient.from_connection_string(
    IMAGE_BLOB_CONNECTION_STRING)

app = func.FunctionApp()


def save_to_blob(filename: str, content: bytes):
    """
    Saves a blob to the Azure Blob Storage.

    Args:
        filename (str): Filename to save the blob as
        content (bytes): Content in bytes to save
    """
    logging.info('Saving content to image blob storage as: %s', filename)
    # saves the content in bytes into the azure blob specified by
    # image endpoint
    blob_client = blob_service_client.get_blob_client(
        IMAGE_BLOB_CONTAINER, filename)
    try:
        blob_client.upload_blob(content)
    # NOTE: It's okay to do a catch all, because all errors that can
    # occur must come from uploading the blob / compressing the image
    except Exception as e:  # pylint: disable=[broad-exception-caught]
        logging.error('Unable to upload blob: %s', e)
        raise e


def save_reference_to_db(_conversation_id: str, _image_id: str):
    """
    Saves the image reference to the database as a history item.

    Args:
        conversation_id (str): Conversation ID to save as
        image_id (str): Image ID. This should exist in the blob
                        storage as {image_id}.jpg
    """
    # TODO: save the image. This is left empty for now because a
    # database change is required, and that's another card


def shadow_to_db(conversation_id: str, content: bytes):
    """
    Shadows the image upload to the database for history reasons.

    This function is designed not to throw any errors, because the
    failure to save an image should not prevent the model from
    interpreting the image.

    Args:
        conversation_id (str): The conversation ID of this request
        content (bytes): The bytes to save. This MUST be JPEG, and NO
                         checks will be performed
    """
    iden = str(uuid4()).replace('-', '')
    try:
        save_to_blob(f"{iden}.jpg", content)
        save_reference_to_db(conversation_id, iden)
    except Exception:  # pylint: disable=[broad-exception-caught]
        pass


def handle_post(req: func.HttpRequest) -> func.HttpResponse:
    # pylint: disable=too-many-return-statements
    """
    Handles the POST request.

    Args:
        req (func.HttpRequest): The request passed verbatim

    Return:
        func.HttpResponse: The response after processing the message
    """
    if 'conversation_id' not in req.params:
        logging.info('Request does not contain conversation ID')
        return func.HttpResponse(
            status_code=400,
        )

    conversation_id = req.params['conversation_id']

    if 'image' not in req.files:
        logging.info('Request does not have image form data')
        return func.HttpResponse(
            body="no data",
            status_code=400,
        )

    if len(req.get_body()) > 1024 * 1024 * 10:
        logging.info('Request\'s body is too large')
        return func.HttpResponse(
            body="image too large",
            status_code=400,
        )

    file: SpooledTemporaryFile
    file = req.files['image'].stream
    body = file.read()

    if len(body) == 0:
        logging.info('Request\'s body is zero')
        return func.HttpResponse(
            body="no body",
            status_code=400,
        )

    magic_detection = puremagic.magic_string(body)
    if len(magic_detection) == 0 or \
       not magic_detection[0].mime_type.startswith('image'):
        logging.info('Request\'s body is unrecognized')
        return func.HttpResponse(
            body="unsupported file type",
            status_code=400,
        )

    try:
        compressed = compress_image(body)
    except OSError:
        logging.error('Cannot compress uploaded image')
        return func.HttpResponse(
            status_code=500,
        )

    # TODO: call Aadhik's function to do magical image inference
    shadow_to_db(conversation_id, compressed)

    logging.info('Request completed')
    return func.HttpResponse(
        status_code=200,
    )


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Entrypoint.

    Args:
        req (func.HttpRequest): The HTTP request into this method

    Return:
        func.HttpResponse: The response to the request
    """
    logging.info('Chat Image called with %s', req.method)
    if req.method == 'POST':
        return handle_post(req)

    logging.info('Fell through, no supported methods')
    return func.HttpResponse(
        status_code=200,
    )
