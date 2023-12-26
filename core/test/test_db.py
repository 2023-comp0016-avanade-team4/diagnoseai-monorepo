"""
Various functions to test stuff in models/.

Only valuable functions are tested
"""

import unittest
from typing import Tuple
from unittest.mock import MagicMock, patch

from core.models.chat_message import ChatMessageDAO, ChatMessageModel


class TestDB(unittest.TestCase):
    """
    Tests some parts of the DAO that is cannot be covered by any
    existing endpoints.
    """

    def run_get_all_messages_with_range(
            self, msg_range: Tuple[int, int]) -> int:
        """
        Runs the get_all_messages_for_conversation function with a
        range. Returns a tuple with the number of "wheres" called.

        It is difficult to get the Where clause directly due to
        SQLAlchemy ORM magic, so we've just gotta settle for caluse
        lengths

        Ideally, we would spin up a in-memory sqlite database to test
        this, but I'm writing a unit test, not an integration test.

        Args:
            msg_range (Tuple[int, int]): The range to test with

        Returns:
            int: The number of "wheres" called
        """
        with patch('core.models.chat_message.select') as select:
            with patch('sqlalchemy.orm.Session') as session:
                whereable = MagicMock()
                whereable_nested = MagicMock()
                whereable_nested_more = MagicMock()
                whereable.where.return_value = whereable_nested
                whereable_nested.where.return_value = whereable_nested_more
                select.return_value = whereable
                ChatMessageDAO.get_all_messages_for_conversation(
                    session, '123', msg_range=msg_range)

                return len(whereable.where.call_args_list) \
                    + len(whereable_nested.where.call_args_list) \
                    + len(whereable_nested_more.where.call_args_list)

    def test_get_all_messages_for_conversation_range_start(self):
        """
        Tests only the range start
        """
        self.assertEqual(self.run_get_all_messages_with_range((1, -1)), 2)

    def test_get_all_messages_for_conversation_range_end(self):
        """
        Tests only the range end
        """
        self.assertEqual(self.run_get_all_messages_with_range((1, -1)), 2)

    def test_get_all_messages_for_conversation_range_start_and_end(self):
        """
        Tests the range with both start and end
        """
        self.assertEqual(self.run_get_all_messages_with_range((1, 999)), 3)

    def test_save_message_no_past_messages(self):
        """
        If there are old messages in the database, then the order
        should be the next-in-sequence
        """
        with patch(
                'core.models.chat_message.ChatMessageDAO'
                '.get_all_messages_for_conversation'
        ) as m:
            m.return_value = [
                ChatMessageModel(
                    conversation_id='123', order=1)]
            session = MagicMock()
            message = MagicMock()
            ChatMessageDAO.save_message(session, message)
            session.add.assert_called_once()
            self.assertEqual(message.order, 2)
