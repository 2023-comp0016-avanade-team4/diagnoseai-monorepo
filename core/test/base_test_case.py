"""
All test files should inherit from this class. This class ensures that
all patch mocks are cleared, preventing side effects from leaking to
other tests.
"""

import unittest
import logging
from unittest.mock import patch


# Disables all logging. Tests producing logs pollute the output
logging.disable(logging.FATAL)


class BaseTestCase(unittest.TestCase):
    """
    Base test case class
    """

    @staticmethod
    def tearDownClass():
        patch.stopall()
