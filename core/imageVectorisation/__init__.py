import logging
import os

from azure.functions import HttpRequest, HttpResponse
from openai import AzureOpenAI

from langchain.embeddings import AzureOpenAIEmbeddings
from langchain.vectorstores.azuresearch import AzureSearch
from langchain.text_splitter import CharacterTextSplitter

import requests 
import json 

api_base = os.environ["GPT4V_API_BASE"]
deployment_name = os.environ['GPT4V_DEPLOYMENT_NAME']
API_KEY = os.environ['GPT4V_API_KEY']


SEARCH_KEY = os.environ["CognitiveSearchKey"] 
SEARCH_ENDPOINT = os.environ["CognitiveSearchEndpoint"] 

OPENAI_KEY = os.environ["OpenAIKey"]
OPENAI_ENDPOINT = os.environ["OpenAIEndpoint"]

os.environ["AZURE_OPENAI_API_KEY"] = OPENAI_KEY
os.environ["AZURE_OPENAI_ENDPOINT"] = OPENAI_ENDPOINT

client = AzureOpenAI(
        api_key=API_KEY,
        api_version="2023-12-01-preview",
        azure_endpoint=api_base,
        )



base_url = f"{api_base}openai/deployments/{deployment_name}" 
headers = {   
    "Content-Type": "application/json",   
    "api-key": API_KEY 
}

embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-ada-002",
    api_version="2023-05-15",
)

text_splitter = CharacterTextSplitter(
    separator="\n\n",
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    is_separator_regex=False,
)

endpoint = f"{base_url}/chat/completions?api-version=2023-12-01-preview" 
def vectoriseImage(image, vectorIndex):

    data = {
            "messages": [
                {
                    "role" : "system",
                    "content" : "You are a helpful AI assistant."
                    },
                {
                    "role" : "user", 
                    "content" : [
                        {
                            "type" : "image_url",
                            "image_url" : {
                                "url" : image
                                }
                            },
                        {
                            "type" : "text",
                            "text" : "Given an image with the following features, generate a concise textual summary that captures the key elements and context of the image. Imagine this summary will be used as a data source for an OpenAI embeddings endpoint to enable content-based image retrieval. Please ensure the summary is informative and conveys relevant information about the visual content."
                            }
                        ]
                    }

                ],
            "max_tokens" : 2000
            }

    response = requests.post(endpoint, headers=headers, data=json.dumps(data))
    response = json.loads(response.text)

         
    vector_store = AzureSearch(
        azure_search_endpoint=SEARCH_ENDPOINT,
        azure_search_key=SEARCH_KEY,
        index_name=vectorIndex,
        embedding_function=embeddings.embed_query
    )
    texts = text_splitter.create_documents([response['choices'][0]['message']['content']])
    vector_store.add_documents(texts) 

