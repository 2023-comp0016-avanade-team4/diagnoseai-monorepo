"""
Images endpoint.

TODO: This endpoint should also eventually containing fetching images
from the backend to load conversation history. This can either be
here, or in chat_history. Once confirmed, please remove this TODO.
"""

import logging
import puremagic
import os

import azure.functions as func  # type: ignore[import-untyped]

app = func.FunctionApp()

def handle_post(req: func.HttpRequest) -> func.HttpResponse:
    if 'conversation_id' not in req.params:
        return func.HttpResponse(
            status_code=400,
        )

    conversation_id = req.params['conversation_id']
    body = req.get_body()

    if not body and not puremagic.from_string(body).startswith('image'):
        return func.HttpResponse(
            body="unsupported file type"
            status_code=400,
        )

    # TODO: do something with the image

    return func.HttpResponse(
        status_code=500,
    )


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Chat Image called with %s', req.method)
    if req.method == 'POST':
        return handle_post(req)
    return func.HttpResponse(
        status_code=200,
    )
