"""
Base class for all integration tests.

This test handles the setup and teardown of the database, and
provides a session for the tests to use.
"""

import gc
import logging
import random
import string
import subprocess
import unittest
import importlib
from unittest.mock import patch

import jwt
from core.models.conversation_status import (ConversationCompletedStatus,
                                             ConversationStatusModel)
from core.models.work_order import MachineModel, WorkOrderModel
from core.utils.db import Session, create_session
from sqlalchemy.orm import close_all_sessions

logging.basicConfig(level=logging.CRITICAL)


class BaseIntegrationTest(unittest.TestCase):
    """
    Base class for all integration tests.
    """
    db_names: list[str] = []

    @staticmethod
    def generate_fixtures() -> tuple[ConversationStatusModel, MachineModel,
                                     WorkOrderModel]:
        """
        Generates the fixtures for the test.

        Returns:
            tuple[ConversationStatusModel, MachineModel, WorkOrderModel]:
                The conversation status, the machine, and the work order
        """
        machine = MachineModel(
            manufacturer='test',
            model='test'
        )

        conversation_status = ConversationStatusModel(
            conversation_id='123',
            status=ConversationCompletedStatus.NOT_COMPLETED
        )

        work_order = WorkOrderModel(
            machine=machine,
            conversation=conversation_status,
            user_id='test',
            conversation_id='123',
            task_name='something',
            task_desc='something'
        )

        return conversation_status, machine, work_order

    @staticmethod
    def commit_fixtures(session: Session, *fixtures) -> None:
        """
        Commits the fixtures to the session.

        Args:
            session: The session
            fixtures: The fixtures
        """
        for fixture in fixtures:
            session.add(fixture)
        session.commit()
        session.flush()

    @staticmethod
    def create_token_for_user(user_id: str) -> str:
        """
        Creates a token for a user.

        Args:
            user_id (str): The user ID

        Returns:
            str: The token
        """
        payload = {
            'sub': user_id,
            'azp': 'localhost',
        }
        return jwt.encode(payload, 'test', algorithm='HS256')

    @staticmethod
    def reload_modules():
        """
        Reloads relevant modules (functions). Mocks stick with the
        modules cache, so it needs to be removed.

        Call this in the final class setUp() function or immediately before
        every test
        """
        # invalidate import cache; our mock won't stick otherwise!
        # pylint: disable=import-outside-toplevel
        import core.functions.chat
        import core.functions.validation_to_production
        import core.functions.chat_done
        import core.functions.work_order
        import core.functions.chat_history
        import core.functions.chat_connection

        importlib.reload(core.functions.chat)
        importlib.reload(core.functions.validation_to_production)
        importlib.reload(core.functions.chat_done)
        importlib.reload(core.functions.work_order)
        importlib.reload(core.functions.chat_history)
        importlib.reload(core.functions.chat_connection)

    def setUp(self):
        # Have to generate a random DB name, otherwise Python hogs the
        # connection even though it's garbage collected. Need a new DB
        # for every test
        self.db_name = ''.join(random.choices(string.ascii_letters, k=8))
        subprocess.run(
            '/opt/mssql-tools/bin/sqlcmd -S db -U SA -P password123! '
            f'-Q \"CREATE DATABASE {self.db_name}\"',
            shell=True, check=True)

        self.services = patch('utils.services.Services').start()
        self.secrets = patch('utils.secrets.Secrets').start()

        # Mock the JWT to prepare for requests
        self.mocked_secrets = {
            'ClerkPublicKey': 'test',
            'ClerkAZPList': 'localhost'
        }
        self.secrets.return_value.get.side_effect = self.mocked_secrets.get
        self.token = self.create_token_for_user('test')

        # DB is about the only thing we can really connect
        self.session = create_session(
            'db', self.db_name, 'SA', 'password123!', True)
        self.services.return_value.db_session = self.session

    @classmethod
    def tearDownClass(cls):
        for db_name in cls.db_names:
            subprocess.run(
                '/opt/mssql-tools/bin/sqlcmd -S db -U SA -P password123! '
                f'-Q \"DROP DATABASE {db_name}\"',
                shell=True, check=True)

    def tearDown(self):
        engine = self.session.get_bind()
        self.session.close()
        close_all_sessions()
        engine.dispose()
        del self.session  # (tries to) free all resources
        patch.stopall()
        gc.collect()
