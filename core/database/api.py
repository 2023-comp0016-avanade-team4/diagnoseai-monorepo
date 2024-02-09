import azure.functions as func # type: ignore[import-untyped]
from utils.db import create_session
from models.work_order import WorkOrderDAO
import os
import json
import logging

DATABASE_URL = os.environ['DatabaseURL']
DATABASE_NAME = os.environ['DatabaseName']
DATABASE_USERNAME = os.environ['DatabaseUsername']
DATABASE_PASSWORD = os.environ['DatabasePassword']
DATABASE_SELFSIGNED = os.environ.get('DatabaseSelfSigned', 'false') == 'true'

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Get Work Orders function processed a request.')

    user_id = req.params.get('user_id')
    if not user_id:
        return func.HttpResponse(
             "Pass a user_id on the query string or in the request body",
             status_code=400
        )

    with create_session(
        DATABASE_URL, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_SELFSIGNED
    ) as db_session:
        work_orders = WorkOrderDAO.get_all_work_orders_for_user(db_session, user_id)
        work_orders_data = [
            {
                'order_id': wo.order_id,
                'conversation_id': wo.conversation_id
            } for wo in work_orders
        ]

    return func.HttpResponse(
        json.dumps(work_orders_data),
        status_code=200,
        mimetype='application/json'
    )
