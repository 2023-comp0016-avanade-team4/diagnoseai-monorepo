"""
API entrypoint. Eventually, as more endpoints are added, they should
be separated into their own files.
"""

import logging
import os
from json import JSONDecodeError

import azure.functions as func  # type: ignore[import-untyped]
from azure.messaging.webpubsubservice import WebPubSubServiceClient  # type: ignore[import-untyped] # noqa: E501 # pylint: disable=line-too-long
from utils.conversation import (ChatConnectionRequest,
                                ChatConnectionResponse)

app = func.FunctionApp()

WPBSS_CONNECTION_STRING = os.environ['WebPubSubConnectionString']
WPBSS_HUB_NAME = os.environ['WebPubSubHubName']

# Global clients
service: WebPubSubServiceClient = WebPubSubServiceClient \
    .from_connection_string(  # pylint: disable=no-member
        WPBSS_CONNECTION_STRING,
        hub=WPBSS_HUB_NAME
    )


def generate_wss_url(request: ChatConnectionRequest) -> str:
    """
    Generates the client access URL.
    """
    return service.get_client_access_token(
        user_id=request.user_id, minutes_to_expire=60)['url']


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Creates a chat connection

    TODO: contact some database to store user id (if
    needed). WebPubSub service can store user IDs on their own, so we
    may not even need to do this

    Args:
        req (func.HttpRequest): The HTTP request
    """
    logging.info('Chat Connection called with %s', req.method)
    try:
        serialized = ChatConnectionRequest.from_json(req.get_body())
        url = generate_wss_url(serialized)
        return func.HttpResponse(
            ChatConnectionResponse(url, 60).to_json(),
            status_code=200,
            mimetype='application/json'
        )
    except (KeyError, JSONDecodeError) as e:
        logging.error('Cannot deserialize JSON %s', e)
        return func.HttpResponse(
            '', status_code=500
        )
