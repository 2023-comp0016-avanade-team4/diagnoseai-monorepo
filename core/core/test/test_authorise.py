"""
Tests authorization
"""

import unittest
from unittest.mock import MagicMock

from core.utils.authorise_conversation import authorise_user
from sqlalchemy.orm import Session

from base_test_case import BaseTestCase


# Docstrings literally shouldn't matter
# pylint: disable=missing-function-docstring
class TestAuthoriseUser(BaseTestCase):
    """
    Tests the authorise_user function.
    """
    def setUp(self):
        self.mock_session = MagicMock(spec=Session)
        self.mock_get_user_id_for_conversation_id = MagicMock()
        self.patcher = unittest.mock.patch(
            'models.work_order.WorkOrderDAO.get_user_id_for_conversation_id',
            new=self.mock_get_user_id_for_conversation_id)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()

    def test_authorise_user_authorized(self):
        self.mock_get_user_id_for_conversation_id.return_value = 'curr_user_id'
        authorized = authorise_user(self.mock_session, 'conversation_id',
                                    'curr_user_id')
        self.assertTrue(authorized)

    def test_authorise_user_not_authorized(self):
        self.mock_get_user_id_for_conversation_id.return_value = \
            'owner_user_id'
        authorized = authorise_user(self.mock_session, 'conversation_id',
                                    'another_user_id')
        self.assertFalse(authorized)

    def test_authorise_user_no_owner(self):
        self.mock_get_user_id_for_conversation_id.return_value = None
        authorized = authorise_user(self.mock_session, 'conversation_id',
                                    'curr_user_id')
        self.assertFalse(authorized)

    def test_authorise_user_no_curr_user(self):
        authorized = authorise_user(self.mock_session, 'conversation_id', None)
        self.assertFalse(authorized)


if __name__ == '__main__':
    unittest.main()
