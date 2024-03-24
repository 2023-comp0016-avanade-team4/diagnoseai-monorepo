"""
Azure functions to obtain all available work orders for a user.
"""

import json
import logging

import azure.functions as func  # type: ignore[import-untyped]
from models.work_order import ResponseWorkOrderFormat, WorkOrderDAO
from utils.get_user_id import get_user_id
from utils.services import Services


def __fetch_work_orders_for_user(
        user_id: str) -> list[ResponseWorkOrderFormat]:
    work_orders = WorkOrderDAO.get_work_orders_for_user(
        Services().db_session,
        user_id
    )
    return [ResponseWorkOrderFormat.from_dao_result(wo)
            for wo in work_orders]


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Main function to handle HTTP requests and retrieve work orders for a user.

    Args:
        req (func.HttpRequest): The HTTP request object.

    Returns:
        func.HttpResponse: The HTTP response object containing the work orders
        data.
    """
    logging.info("Get Work Orders function processed a request.")

    user_id = req.params.get("user_id")
    if not user_id:
        logging.error("No user_id provided")
        return func.HttpResponse(
            "Pass a user_id on the query string or in the request body",
            status_code=400
        )

    if get_user_id(req.headers["Auth-Token"]) != user_id:
        logging.info("User not authorised to access conversation")
        return func.HttpResponse("Unauthorised", status_code=401)

    work_orders_data = [wo.to_dict()
                        for wo in __fetch_work_orders_for_user(user_id)]

    return func.HttpResponse(
        json.dumps(work_orders_data),
        status_code=200,
        mimetype="application/json"
    )
