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

    @classmethod
    def secrets_and_services_mock(cls, prefix: str, *,
                                  no_secret: bool = False,
                                  no_services: bool = False):
        """
        Mocks the Secrets and Services classes. Requires a prefix.

        Put this in the setUpClass() method of the test class.

        Args:
            prefix (str): The prefix of the module being tested.
            no_secret (bool): If True, do not mock the Secrets class.
            no_services (bool): If True, do not mock the Services class.
        """
        if not no_secret:
            cls.secrets_mock = patch(f'{prefix}.Secrets',
                                     autospec=True,
                                     spec_set=True).start()

        if not no_services:
            cls.services_mock = patch(f'{prefix}.Services',
                                      autospec=True,
                                      spec_set=True).start()

    def tearDown(self):
        if self.secrets_mock:
            self.secrets_mock.reset_mock()

        if self.services_mock:
            self.services_mock.reset_mock()

    @staticmethod
    def tearDownClass():
        patch.stopall()
