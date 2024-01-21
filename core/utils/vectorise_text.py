import os
from langchain.embeddings import AzureOpenAIEmbeddings
from langchain.vectorstores.azuresearch import AzureSearch
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


def vectoriseImageSummary(imageSummary : str, vectorIndex : str) -> None:
    vector_store = AzureSearch(
        azure_search_endpoint=SEARCH_ENDPOINT,
        azure_search_key=SEARCH_KEY,
        index_name=vectorIndex,
        embedding_function=embeddings.embed_query
    )
    texts = text_splitter.create_documents(imageSummary)
    vector_store.add_documents(texts)



