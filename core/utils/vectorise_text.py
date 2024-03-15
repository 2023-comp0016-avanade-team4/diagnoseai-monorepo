"""
This file contains the function to vectorise the image summary text and store it in Azure Search
"""
import os
from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.vectorstores.azuresearch import AzureSearch
from langchain.text_splitter import CharacterTextSplitter

SEARCH_KEY = os.environ["CognitiveSearchKey"]
SEARCH_ENDPOINT = os.environ["CognitiveSearchEndpoint"]

OPENAI_KEY = os.environ["OpenAIKey"]
OPENAI_ENDPOINT = os.environ["OpenAIEndpoint"]

os.environ["AZURE_OPENAI_API_KEY"] = OPENAI_KEY
os.environ["AZURE_OPENAI_ENDPOINT"] = OPENAI_ENDPOINT

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


def vectorise_image_summary(image_summary : str, vector_index: str) -> None:
    """
    Function to vectorise the image summary text and store it in Azure Search
    """
    vector_store = AzureSearch(
        azure_search_endpoint=SEARCH_ENDPOINT,
        azure_search_key=SEARCH_KEY,
        index_name=vector_index,
        embedding_function=embeddings.embed_query
    )
    texts = text_splitter.create_documents(image_summary)
    vector_store.add_documents(texts)
