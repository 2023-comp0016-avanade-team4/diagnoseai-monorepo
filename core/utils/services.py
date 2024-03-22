"""
This module contains the services used throughout the application.

In Azure Function Apps, the entirety of the application might share a
single worker; furthermore, most functions share roughly the same
services.

To prevent:

1) Code duplication, and
2) The need to re-instantiate services for each function,

This module provides a singleton that encapsulates all the
services. In particular, they are all lazy-init - this means that the
services are only instantiated when they are first accessed.

Moreover, modularizing services this way allows us to more easily mock
it for tests.
"""

from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.messaging.webpubsubservice import (  # type: ignore[import-untyped]
    WebPubSubServiceClient)  # noqa: E501 # pylint: disable=line-too-long
from azure.search.documents.indexes import SearchIndexClient
from azure.storage.blob import BlobServiceClient, ContainerClient
from langchain_core.utils import convert_to_secret_str
from langchain_openai import AzureOpenAIEmbeddings
from openai import AzureOpenAI
from sqlalchemy.orm import Session

from utils.db import create_session
from utils.image_summary import ImageSummary
from utils.secrets import Secrets
from utils.singleton import Singleton


# This is justified because the attribtues are defined in __var_init_,
# which is part of the singleton design. Function docstrings not
# necessary, each of the methods are simply init-once attributes
# pylint: disable=attribute-defined-outside-init, missing-function-docstring, too-many-instance-attributes # noqa: E501
class Services(metaclass=Singleton):
    """
    Services singleton containing lazy-init clients. Reads secrets via
    the Secrets class.

    This class will not perform initialization on Secrets, but Secrets
    will auto-init upon the first call to get().
    """
    def __init__(self):
        self._openai_chat_model = None
        self._image_summary_model = None
        self._webpubsub = None
        self._search = None
        self._image_blob_client = None
        self._doc_blob_client = None
        self._search_index_client = None
        self._db_session = None
        self._embeddings = None
        self._document_analysis = None
        self._validation_container_client = None
        self._production_container_client = None
        self._document_cognitive_search_index = None

    @property
    def openai_chat_model(self) -> AzureOpenAI:
        """
        Gets the OpenAI chat model.

        Side note: API version is hardcoded because semantics may
        change code.

        Returns:
            AzureOpenAI: The OpenAI chat model.
        """
        if not self._openai_chat_model:
            openai_url = Secrets().get("OpenAIEndpoint")
            model_name = Secrets().get("OpenAIModelName")
            self._openai_chat_model = AzureOpenAI(
                base_url=(f"{openai_url}/openai/deployments/"
                          f"{model_name}"),
                api_key=Secrets().get("OpenAIKey"),
                api_version='2024-03-01-preview'
            )
        return self._openai_chat_model

    @property
    def image_summary_model(self) -> ImageSummary:
        """
        Gets the image summary model.

        Returns:
            ImageSummary: The image summary model.
        """
        if not self._image_summary_model:
            self._image_summary_model = ImageSummary(
                Secrets().get("GPT4V_API_BASE"),
                Secrets().get("GPT4V_API_KEY"),
                Secrets().get("GPT4V_API_DEPLOYMENT_NAME")
            )
        return self._image_summary_model

    @property
    def webpubsub(self) -> WebPubSubServiceClient:
        if not self._webpubsub:
            # WebPubSubServiceClient DOES have from_connection_string, dunno
            # why PyLint refuses to acknowledge it.
            self._webpubsub = WebPubSubServiceClient \
                .from_connection_string(  # pylint: disable=no-member
                    Secrets().get("WebPubSubConnectionString"),
                    hub=Secrets().get("WebPubSubHubName")
                )
        return self._webpubsub

    @property
    def search(self) -> SearchIndexClient:
        if not self._search:
            self._search = SearchIndexClient(
                Secrets().get("CognitiveSearchEndpoint"),
                AzureKeyCredential(Secrets().get("CognitiveSearchKey"))
            )
        return self._search

    @property
    def image_blob_client(self) -> BlobServiceClient:
        if not self._image_blob_client:
            self._image_blob_client = BlobServiceClient.from_connection_string(
                Secrets().get("ImageBlobConnectionString")
            )
        return self._image_blob_client

    @property
    def doc_blob_client(self) -> BlobServiceClient:
        if not self._doc_blob_client:
            self._doc_blob_client = BlobServiceClient.from_connection_string(
                Secrets().get("DocumentStorageContainer")
            )
        return self._doc_blob_client

    @property
    def search_index_client(self) -> SearchIndexClient:
        if not self._search_index_client:
            self._search_index_client = SearchIndexClient(
                Secrets().get("SummarySearchEndpoint"),
                AzureKeyCredential(Secrets().get("SummarySearchKey"))
            )
        return self._search_index_client

    @property
    def db_session(self) -> Session:
        if not self._db_session:
            self._db_session = create_session(
                Secrets().get("DatabaseURL"),
                Secrets().get("DatabaseName"),
                Secrets().get("DatabaseUsername"),
                Secrets().get("DatabasePassword"),
                Secrets().get("DatabaseSelfSigned") != 'false'
            )
        return self._db_session

    @property
    def embeddings(self) -> AzureOpenAIEmbeddings:
        if not self._embeddings:
            self._embeddings = AzureOpenAIEmbeddings(
                azure_endpoint=Secrets().get("OpenAIEndpoint"),
                api_key=convert_to_secret_str(Secrets().get("OpenAIKey")),
                azure_deployment="text-embedding-ada-002",
                api_version="2023-05-15",
            )
        return self._embeddings

    @property
    def document_analysis(self) -> DocumentAnalysisClient:
        if not self._document_analysis:
            self._document_analysis = DocumentAnalysisClient(
                Secrets().get("CognitiveSearchEndpoint"),
                AzureKeyCredential(Secrets().get("CognitiveSearchKey"))
            )
        return self._document_analysis

    @property
    def validation_container_client(self) -> ContainerClient:
        if not self._validation_container_client:
            self._validation_container_client = \
                self._doc_blob_client.get_container_client(
                    Secrets().get("DocumentValidationContainerName")
                )
        return self._validation_container_client

    @property
    def production_container_client(self) -> ContainerClient:
        if not self._production_container_client:
            self._production_container_client = \
                self._doc_blob_client.get_container_client(
                    Secrets().get("DocumentProductionContainerName")
                )
        return self._production_container_client

    @property
    def document_cognitive_search_index(self) -> SearchIndexClient:
        if not self._document_cognitive_search_index:
            self._document_cognitive_search_index = SearchIndexClient(
                Secrets().get("CognitiveSearchEndpoint"),
                AzureKeyCredential(Secrets().get("CognitiveSearchKey"))
            )
        return self._document_cognitive_search_index
