"""
This is the main entry point for all Azure Functions.  It contains the
following endpoints:

Do not import this file for tests.

Function docstrings are disabled in this file because the pointed
function should all have the docstring.
"""

# pragma: no cover

import logging
from typing import Callable

import azure.functions as func
from azure.functions.decorators.core import DataType

from functions.chat import main as chat_main
from functions.chat_connection import main as chat_connection
from functions.chat_done import main as chat_done
from functions.chat_history import main as chat_history
from functions.file_upload_trigger import main as file_upload_trigger
from functions.validation_to_production import main as validation_to_production
from functions.work_order import main as work_order
from utils.verify_token import verify_token

logging.basicConfig(level=logging.INFO)

bp = func.Blueprint()


def __auth_guard(req: func.HttpRequest,
                 fn: Callable[[func.HttpRequest], func.HttpResponse]
                 ) -> func.HttpResponse:
    """
    Guard function for all routes. Verifies the token.

    Args:
        req (func.HttpRequest): The request
        fn (Callable[[func.HttpRequest], func.HttpResponse]):
            The function to call

    Returns:
        func.HttpResponse: The response from the fn if authorized. Else, 401
    """
    if not verify_token(req.headers.get('Auth-Token')):
        logging.info('Call from unauthenticated user')
        return func.HttpResponse(
            "Unauthenticated",
            status_code=401
        )
    return fn(req)


# NOTE: Chat is a special WebPubSubTrigger endpoint. Traditionally,
# this can only be done with a function.json, which means that we had
# to do some special shenanigans with generic_triggers to get this to
# work.  In the future, whenever the Azure Python SDK gets the
# WebPubSubTrigger as a real trigger, consider migrating to that
# trigger.
@bp.function_name(name='Chat')
@bp.generic_trigger('request', 'WebPubSubTrigger',
                    hub='chat',
                    data_type=DataType.STRING,
                    eventName='message',
                    eventType='user')
def __chat_main(request: str) -> None:
    chat_main(request)


@bp.function_name('chat_connection')
@bp.route(methods=['POST'])
def __chat_connection(req: func.HttpRequest) -> func.HttpResponse:
    return __auth_guard(req, chat_connection)


@bp.function_name('chat_history')
@bp.route(methods=['GET'])
def __chat_history(req: func.HttpRequest) -> func.HttpResponse:
    return __auth_guard(req, chat_history)


@bp.function_name('file_upload_trigger')
@bp.blob_trigger('blob', 'verification/{fileName}', 'DocumentStorageContainer')
def __file_upload_trigger(blob: func.InputStream) -> None:
    file_upload_trigger(blob)


@bp.function_name('validation_to_production')
@bp.route(methods=['POST'])
def __validation_to_production(req: func.HttpRequest) -> func.HttpResponse:
    return __auth_guard(req, validation_to_production)


@bp.function_name("work_order")
@bp.route(methods=["GET"])
def __work_order(req: func.HttpRequest) -> func.HttpResponse:
    return __auth_guard(req, work_order)


@bp.function_name("chat_done")
@bp.route(methods=["POST"])
def __chat_done(req: func.HttpRequest) -> func.HttpResponse:
    return __auth_guard(req, chat_done)


app = func.FunctionApp()
app.register_functions(bp)
