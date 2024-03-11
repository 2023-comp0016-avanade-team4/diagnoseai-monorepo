"""
This is the main entry point for all Azure Functions.  It contains the
following endpoints:

Do not import this file for tests.

Function docstrings are disabled in this file because the pointed
function should all have the docstring.
"""

# pragma: no cover

import azure.functions as func
from functions.chat import main as chat_main
from functions.chat_connection import main as chat_connection
from functions.chat_history import main as chat_history
from functions.file_upload_trigger import main as file_upload_trigger
from functions.poc import main as poc
from functions.validation_to_production import main as validation_to_production
from functions.work_order import main as work_order

bp = func.Blueprint()


# NOTE: Chat is a special WebPubSubTrigger endpoint. Traditionally,
# this can only be done with a function.json, which means that we had
# to do some special shenanigans with generic_triggers to get this to
# work.  In the future, whenever the Azure Python SDK gets the
# WebPubSubTrigger as a real trigger, consider migrating to that
# trigger.
@bp.function_name(name='Chat')
@bp.generic_trigger('req', 'WebPubSubTrigger',
                    data_type='string',
                    hub='chat',
                    eventName='message',
                    eventType='user')
def __chat_main(req: str) -> None:
    chat_main(req)


@bp.function_name('chat_connection')
@bp.route(methods=['POST'])
def __chat_connection(req: func.HttpRequest) -> func.HttpResponse:
    return chat_connection(req)


@bp.function_name('chat_history')
@bp.route(methods=['GET'])
def __chat_history(req: func.HttpRequest) -> func.HttpResponse:
    return chat_history(req)


@bp.function_name('file_upload_trigger')
@bp.blob_trigger('blob', 'verification/{fileName}', 'BlobBindingConnection')
def __file_upload_trigger(blob: func.InputStream) -> None:
    file_upload_trigger(blob)


@bp.function_name('ProofOfConcept')
@bp.blob_trigger('blob', 'validation-documents', 'BlobBindingConnection')
def __poc(blob: func.InputStream) -> None:
    poc(blob)


@bp.function_name('validation_to_production')
@bp.route(methods=['POST'])
def __validation_to_production(req: func.HttpRequest) -> func.HttpResponse:
    return validation_to_production(req)


@bp.function_name("work_order")
@bp.route(methods=["GET"])
def __work_order(req: func.HttpRequest) -> func.HttpResponse:
    return work_order(req)


app = func.FunctionApp()
app.register_functions(bp)
