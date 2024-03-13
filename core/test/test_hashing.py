"""
Trivially tests the hashing package
"""

import unittest

from core.utils.hashing import get_search_index_for_user_id


class TestHashing(unittest.TestCase):
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
