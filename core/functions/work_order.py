import os
import json
import logging
import azure.functions as func  # type: ignore[import-untyped]
from utils.db import create_session
from models.work_order import WorkOrderDAO
from utils.verify_token import verify_token
from utils.get_user_id import get_user_id


DATABASE_URL = os.environ["DatabaseURL"]
DATABASE_NAME = os.environ["DatabaseName"]
DATABASE_USERNAME = os.environ["DatabaseUsername"]
DATABASE_PASSWORD = os.environ["DatabasePassword"]
DATABASE_SELFSIGNED = os.environ.get("DatabaseSelfSigned", "false") == "true"


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Main function to handle HTTP requests and retrieve work orders for a user.

    Args:
        req (func.HttpRequest): The HTTP request object.

    Returns:
        func.HttpResponse: The HTTP response object containing the work orders
        data.
    """
    if not verify_token(req.headers["Auth-Token"]):
        return func.HttpResponse("Unauthorised", status_code=401)

    logging.info("Get Work Orders function processed a request.")

    user_id = req.params.get("user_id")
    if not user_id:
        return func.HttpResponse(
            "Pass a user_id on the query string or in the request body",
            status_code=400
        )

    if get_user_id(req.headers["Auth-Token"]) != user_id:
        return func.HttpResponse("Unathorised", status_code=401)

    with create_session(
        DATABASE_URL,
        DATABASE_NAME,
        DATABASE_USERNAME,
        DATABASE_PASSWORD,
        DATABASE_SELFSIGNED,
    ) as db_session:

        work_orders = WorkOrderDAO.get_work_orders_for_user(
            db_session,
            user_id
        )
        work_orders_data = [
            {
                "order_id": wo.order_id,
                "machine_id": wo.machine_id,
                "machine_name": WorkOrderDAO.get_machine_name_for_machine_id(
                    db_session, wo.machine_id
                ),
                "conversation_id": wo.conversation_id,
            }
            for wo in work_orders
        ]

    return func.HttpResponse(
        json.dumps(work_orders_data),
        status_code=200,
        mimetype="application/json"
    )
