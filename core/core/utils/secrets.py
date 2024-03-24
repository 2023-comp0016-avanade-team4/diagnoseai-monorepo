"""
Secrets module. All Azure services require some sort of authentication
mechanism to access them. This module provides a way to store and
retrieve these secrets; it can be easily swapped out for a more robust
solution.

The Secrets class is a singleton that strictly loads all environment
variables required by the application. Strictly loading such
environment variables allows the function to fail-first, signalling to
the developer that something is wrong from the onset, rather than
during usage.
"""

import os
from typing import Optional

from utils.singleton import Singleton


class SecretsException(Exception):
    """
    Exception raised when the Secrets class encounters an error.
    """


# pylint: disable=too-few-public-methods
class Secrets(metaclass=Singleton):
    """
    A strict singleton class that loads all required secrets.

    The ideal usage involves initializing this class once with
    init_only() then calling `Secrets.get(key)` to retrieve keys
    during application usage.

    If init_only() passes, all the environment variables are
    guaranteed to exist.
    """
    __load_from_env: list[str] = [
        "WebPubSubConnectionString",
        "WebPubSubHubName",
        "CognitiveSearchKey",
        "CognitiveSearchEndpoint",
        "SummarySearchKey",
        "SummarySearchEndpoint",
        "OpenAIEndpoint",
        "OpenAIKey",
        "OpenAIModelName",
        "SummarizationModel",
        "DatabaseURL",
        "DatabaseName",
        "DatabaseUsername",
        "DatabasePassword",
        "DatabaseSelfSigned",
        "DocumentEndpoint",
        "DocumentKey",
        "DocumentStorageContainer",
        "DocumentProductionContainerName",
        "DocumentValidationContainerName",
        "ImageBlobConnectionString",
        "ImageBlobContainer",
        "GPT4VAPIBase",
        "GPT4VAPIKey",
        "GPT4VDeploymentName",
        "ClerkPublicKey",
        "ClerkAZPList",
        "SMTPServer",
        "SMTPUsername",
        "SMTPPassword",
        "UploaderBaseURL"
    ]

    def __init__(self) -> None:
        self.__loaded_vars: Optional[dict[str, str]] = {}
        self.__make_secrets()

    def __make_secrets(self) -> None:
        self.__loaded_vars = {}
        for env in self.__load_from_env:
            if env not in os.environ:
                raise SecretsException(f"Missing environment variable: {env}")
            self.__loaded_vars[env] = os.environ[env]

    def get(self, key: str) -> str:
        """
        Gets a secret from the environment variables. If Secrets have
        not been initialized by this point, it will be.
        """
        if self.__loaded_vars is None:
            self.__make_secrets()

        assert self.__loaded_vars is not None

        if key in self.__loaded_vars:
            return self.__loaded_vars[key]

        raise SecretsException(
            f"Did not define {key}. Did you update secrets.py?")
