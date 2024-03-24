"""
Validation to Production + Citation integration testing.

Specifically, tests that a file is moved from the validation storage
container to the production storage container, and that the citation
gets a URL to the production storage container.

This test is meant to be run on the docker compose.
"""

from unittest.mock import create_autospec

from azure.functions import HttpRequest
from azure.storage.blob import BlobServiceClient
from core.utils.chat_message import ChatMessage
from core.utils.web_pub_sub_interfaces import WebPubSubRequest
from openai.types.chat.chat_completion import (ChatCompletion,
                                               ChatCompletionMessage, Choice)

from base_int_test import BaseIntegrationTest

AZURITE_CONNECTION_STRING = 'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;'  # pylint: disable=line-too-long # noqa: E501


class TestV2PThenCitations(BaseIntegrationTest):
    """
    Tests validation to production (the blob moving part, the indexing
    part requires a real service which we don't want to access in the
    test). It's also covered by the unit test
    """
    def setUp(self):
        super().setUp()

        doc_blob_client = BlobServiceClient.from_connection_string(
            AZURITE_CONNECTION_STRING)

        # create the two containers in question
        doc_blob_client.create_container('validation')
        doc_blob_client.create_container('production')

        self.mocked_secrets['DocumentValidationContainerName'] = 'validation'
        self.mocked_secrets['DocumentProductionContainerName'] = 'production'

        self.services.return_value.doc_blob_client = doc_blob_client
        self.services.return_value.validation_container_client = \
            doc_blob_client.get_container_client('validation')
        self.services.return_value.production_container_client = \
            doc_blob_client.get_container_client('production')

        # "upload" a file to the validation container
        self.services.return_value.validation_container_client.upload_blob(
            name='test',
            data=b'test',
            overwrite=True,
        )

        # setup a message with citations
        chat_completion = create_autospec(ChatCompletion)
        chat_completion_message = create_autospec(ChatCompletionMessage)
        choice = create_autospec(Choice)
        chat_completion_message.content = 'reply!'
        chat_completion_message.role = 'bot'
        chat_completion_message.context = {'citations': [
            {
                'title': 'Test Citation',
                'url': '',
                'content': 'This is a citation',
                'filepath': 'test.pdf',
                'chunk_id': '0',
            },
        ]}
        choice.message = chat_completion_message
        chat_completion.choices = [choice]
        self.services.return_value.openai_chat_model.chat.completions.\
            create.return_value = chat_completion

        # mock the rest of azure that affects the flow
        self.services.return_value.document_cognitive_search_index.\
            list_index_names.return_value = [
                'test',
            ]

        self.reload_modules()

    def tearDown(self):
        super().tearDown()
        self.services.return_value.validation_container_client.\
            delete_container()
        self.services.return_value.production_container_client.\
            delete_container()

    def test_flow(self):
        """
        Tests the flow of validation to production and citation translation
        """
        # Importing here to force mocks to override globally
        # pylint: disable=import-outside-toplevel
        from core.functions.chat import main as chat_main
        from core.functions.validation_to_production import main as v2p_main

        # run the validation to production function
        request = HttpRequest(
            method='POST',
            url='/api/ValidationToProduction',
            headers={'Auth-Token': self.token},
            body=(b'{"validation_index_name": "test",'
                  b' "production_index_name": "does not matter"}'),
        )
        response = v2p_main(request)
        self.assertEqual(response.status_code, 200)

        # check that the file is moved to the production container
        production_blob = self.services.return_value.\
            production_container_client.get_blob_client('test.pdf')
        self.assertTrue(production_blob.exists())

        conversation_status, machine, work_order = self.generate_fixtures()
        self.commit_fixtures(self.session, conversation_status, machine,
                             work_order)

        # check that the citation has the correct URL
        chat_message = ChatMessage(
            conversation_id='123',
            auth_token=self.token,
            is_image=False,
            message='test message',
            sent_at=1711144789,
        )
        request = WebPubSubRequest(
            data=chat_message.to_json(),
            connection_context={'connectionId': '123'},
        )
        chat_main(request.to_json())

        calls_to_webpubsub = self.services.return_value.webpubsub.\
            send_to_connection.call_args_list
        self.assertEqual(len(calls_to_webpubsub), 1)
        self.assertEqual(calls_to_webpubsub[0][0][0], '123')
        self.assertIn('test.pdf', calls_to_webpubsub[0][0][1])
        self.assertIn('http://azurite:10000/devstoreaccount1/production/',
                      calls_to_webpubsub[0][0][1])
        self.assertIn('sig', calls_to_webpubsub[0][0][1])
