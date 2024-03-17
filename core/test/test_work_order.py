"""
Module to test the work_order endpoint
"""

import unittest
import os
import json
from unittest.mock import patch, create_autospec
import azure.functions as func  # pylint: disable=E0401
from models.work_order import (WorkOrderModel,
                               MachineModel)  # pylint: disable=E0401
from base_test_case import BaseTestCase

db_session_patch = patch("utils.db.create_session").start()

os.environ["DatabaseURL"] = ""
os.environ["DatabaseName"] = ""
os.environ["DatabaseUsername"] = ""
os.environ["DatabasePassword"] = ""
os.environ["DatabaseSelfSigned"] = ""
os.environ["CLERK_PUBLIC_KEY"] = ""
os.environ["CLERK_AZP_LIST"] = ""

# This import must come after the global patches
# pylint: disable=wrong-import-position
from core.functions.work_order import main  # noqa: E402 pylint: disable=C0413


class TestWorkOrder(BaseTestCase):
    """
    Tests the Work Orders API
    """
    def setUp(self):
        self.verifyjwt_patch = patch('core.functions.work_order.verify_token') \
            .start()
        self.get_user_id_patch = patch('core.functions.work_order.get_user_id') \
            .start()

        self.verifyjwt_patch.return_value = True
        self.get_user_id_patch.return_value = "test_id"

    def tearDown(self) -> None:
        self.verifyjwt_patch.stop()
        self.get_user_id_patch.stop()

    def test_get_work_orders_for_user_happy_path(self):
        """
        Test getting work orders for a user successfully
        """
        mock_work_orders = [
            create_autospec(WorkOrderModel, spec_set=True),
            create_autospec(WorkOrderModel, spec_set=True),
        ]

        mock_work_orders[0].order_id = "order1"
        mock_work_orders[0].user_id = "user123"
        mock_work_orders[0].machine_id = "machine1"
        mock_work_orders[0].conversation_id = "conv1"
        mock_work_orders[0].task_name = "task1"
        mock_work_orders[0].task_desc = "task1 desc"
        mock_work_orders[0].machine = create_autospec(MachineModel)
        mock_work_orders[0].machine.get_machine_name.return_value \
            = "BrandX ModelY"

        mock_work_orders[1].order_id = "order2"
        mock_work_orders[1].user_id = "user123"
        mock_work_orders[1].machine_id = "machine2"
        mock_work_orders[1].conversation_id = "conv2"
        mock_work_orders[1].task_name = "task2"
        mock_work_orders[1].task_desc = "task2 desc"
        mock_work_orders[1].machine = create_autospec(MachineModel)
        mock_work_orders[1].machine.get_machine_name.return_value \
            = "BrandA ModelB"

        with patch(
            "models.work_order.WorkOrderDAO.get_work_orders_for_user",
            return_value=mock_work_orders,
        ):

            # mock HTTP request
            req = func.HttpRequest(
                method="GET",
                url="/api/work_order",
                headers={"Auth-Token": "test"},
                params={"user_id": "test_id"},
                body=b"",
            )

            response = main(req)

            self.assertEqual(response.status_code, 200)
            expected_response_body = json.dumps(
                [
                    {
                        "order_id": "order1",
                        "machine_id": "machine1",
                        "machine_name": "BrandX ModelY",
                        "conversation_id": "conv1",
                        "task_name": "task1",
                        "task_desc": "task1 desc",
                        "resolved": [],
                    },
                    {
                        "order_id": "order2",
                        "machine_id": "machine2",
                        "machine_name": "BrandA ModelB",
                        "conversation_id": "conv2",
                        "task_name": "task2",
                        "task_desc": "task2 desc",
                        "resolved": [],
                    },
                ]
            )
            self.assertEqual(
                response.get_body().decode(),
                expected_response_body
            )

    def test_get_work_orders_for_user_no_user_id(self):
        """
        Test the response when no user_id is provided in the request
        """
        req = func.HttpRequest(
            method="GET",
            url="/api/work_order",
            headers={"Auth-Token": "test"},
            params={},
            body=b"",
        )

        response = main(req)

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "Pass a user_id on the query string or in the request body",
            response.get_body().decode(),
        )
