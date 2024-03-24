"""
Trivially tests the hashing package
"""

from core.utils.hashing import get_search_index_for_user_id
from base_test_case import BaseTestCase


class TestHashing(BaseTestCase):
    """
    Tests the hashing package
    """

    def test_get_search_index_for_user_id(self):
        """
        Tests the get_search_index_for_user_id function
        """
        self.assertIn(
            'user',
            get_search_index_for_user_id('test')
        )
