"""
Module to test work orders
"""
import unittest
import os
import json
from unittest.mock import patch
import azure.functions as func  # pylint: disable=E0401
from models.work_order import WorkOrderModel  # pylint: disable=E0401

db_session_patch = patch("utils.db.create_session").start()

os.environ["DatabaseURL"] = ""
os.environ["DatabaseName"] = ""
os.environ["DatabaseUsername"] = ""
os.environ["DatabasePassword"] = ""
os.environ["DatabaseSelfSigned"] = ""
os.environ["CLERK_PUBLIC_KEY"] = ""
os.environ["CLERK_AZP_LIST"] = ""

from core.work_order.api import main  # noqa: E402 pylint: disable=C0413


class TestWorkOrder(unittest.TestCase):
    """
    Tests the Work Orders API
    """

    def setUp(self):
        self.verifyjwt_patch = patch('core.work_order.api.verify_token') \
            .start()
        self.get_user_id_patch = patch('core.work_order.api.get_user_id') \
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
            WorkOrderModel(
                order_id="order1",
                user_id="user123",
                machine_id="machine1",
                conversation_id="conv1",
            ),
            WorkOrderModel(
                order_id="order2",
                user_id="user123",
                machine_id="machine2",
                conversation_id="conv2",
            ),
        ]

        mock_machine_names = {
            "machine1": "BrandX ModelY",
            "machine2": "BrandA ModelB"
        }

        with patch(
            "models.work_order.WorkOrderDAO.get_work_orders_for_user",
            return_value=mock_work_orders,
        ), patch(
            "models.work_order.WorkOrderDAO.get_machine_name_for_machine_id",
            side_effect=lambda _, machine_id: mock_machine_names[machine_id],
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
                    },
                    {
                        "order_id": "order2",
                        "machine_id": "machine2",
                        "machine_name": "BrandA ModelB",
                        "conversation_id": "conv2",
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


@classmethod
def tearDownClass(cls):
    db_session_patch.stop()
