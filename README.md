# DiagnoseAI Core API

This is the DiagnoseAI core API; the main deliverable of COMP0016 Team
4.

## Overview - High Level

Core API provides a common API that can be utilized by all interfaces
intending to integrate their services with DiagnoseAI. At a high
level, it exposes the following functionality:

1. Processes, vectorizes and indexes documents from the Uploader
   interface into a Vector Database (`file_upload_trigger`).
2. Guarding underlying services with secure pre-authenticated
   URLs. Services affected includes `WebPubSubService` and `Azure Blob Storage`.
3. Handling multiple conversations (including history) between any
   connected users to Azure OpenAI.
4. Indexing and summarizing conversations. Summarized conversations
   are **private** to the user, and can be referenced in a future
   conversation.
5. Management of indexes around the Vector Database; promoting any
   documents used for validation (on the Uploader) to a real index
   used for production (on any participating interfaces).

For the full API specification, please see:

- `core/swagger.yml` - Contains the documentation for all available
  endpoints. At the time of writing, this includes:
  - `/chat_conversation`: Establishes a chat connection with any
    participating interface. This endpoint returns a preauthenticated
    `WebSocket` URL that interfaces should establish a connection to.
  - `/chat_history`: Retrieves all past messages of a chat given a
    conversation.
  - `/chat_done`: Marks a conversation as done, automatically
    summarizing the contents for future reference.
  - `/work_order`: Retrieves all associated _work orders_ to a
    user. _Work orders_ describes all the information a technician
    requires to complete a job; task name, task description, and the
    machine to repair. In DiagnoseAI, work orders and conversations
    share a one-to-one relationship.
- `core/asyncapi2.yml` - Contains `WebSocket` message templates
  supported by Core API. The `WebSocket` URL is generated with
  `/chat_conversation`.

## Overview - Technicality

Core API acts as an aggregated proxy between the WebApp and relevant
services:

- Authentication with a third-party OAuth provider
- Azure SQL
- Azure AI Search (formerly Cognitive Search)
- Azure API Management Service
- Azure Blob Storage
- Azure OpenAI Service
- Azure WebPubSubService

As mentioned in the overview above, the developer is encouraged to
read `core/swagger.yml` and `core/asyncapi2.yaml` for API documentation.

Core API is built with the following design goals in mind:

1. Scalable
2. Auth-independent
3. Cloud-native

By being _serverless_ on **Azure Function App**, and using JWT tokens,
Core API achieves the above goals to a tee.

# Prerequisites

As a consequence of running on **Azure Function App**, it is designed
_not_ to run on a local computer. Pure HTTP endpoints, such as those
found in:

- `functions/chat_connection.py`
- `functions/chat_done.py`
- `functions/chat_history.py`
- `functions/work_order.py`

can be ran locally with a local database and **Azurite** (explained
later), but will still require connection to some real Azure services
with no known local replacements, such as:

- Azure OpenAI
- Azure WebPubSubService
- AI Search

Hence, it is imperative that the developer **must** have access to all
requisite services for a successful deployment. Should this not be
possible, it is recommended that DiagnoseAI be evaluated via the
online demo.

The guide following this assumes an environment is setup to have:

1. An Azure Account with access to services stated in [Overview -
  Technicality](#overview---technicality)
2. Python 3.10
3. A Linux machine. Most commands can be substituted for a non-Linux
   setup, however, that is outside the scope of this guide.

# Guide

There are **two** guides embedded in this README:

1. **Deployment Guide** - This is the guide to read if you intend to
   deploy the repository as-is, without any unnecessary modifications.
2. **Development Guide** - This is the guide to read if you intend to
   either make changes to the repository, or run HTTP endpoints
   locally. (**Note**: It is **not possible** to run the `chat`
   function locally)

The above guides have some overlapping sections; hence, please refer
to the below table of contents.

**Table of Contents (Deployment Guide)**

1. [Installing Azure Functions Core
   Tools](#installing-azure-functions-core-tools)
2. [Creating the relevant Azure
   services](#creating-the-relevant-azure-services)
3. [Deploying Core API](#deploying-core-api)

**Table of Contents (Development Guide)**

1. [Installing Azure Functions Core
   Tools](#installing-azure-functions-core-tools)
2. [Configuring Local Development](#configuring-local-development)
4. [Installing development
   dependencies](#installing-development-dependencies)
5. [Running Azurite](#running-azurite)
6. [Running MSSQL](#running-mssql)
7. [Installing required
   dependencies](#installing-required-dependencies)
2. [Creating the relevant Azure
   services](#creating-the-relevant-azure-services)
3. [Running the functions locally](#running-the-functions-locally)
3. [Deploying Core API](#deploying-core-api)

----

## Installing Azure Functions Core Tools

Run the following commands:

```
sudo npm install -g azure-functions-core-tools@4 --unsafe-perm true \
sudo npm install -g azurite # optional for deployment-only
```

`azure-function-core-tools` provide the `func` command that is
required to deploy the functions onto Azure Function Apps.

`azurite` simulates some Azure storage services such as Azure's Blob
Storage. This is not required for deployment purposes.

Return to [Guide](#guide).

----

## Creating the relevant Azure services

As a recap, Core API requires the following services:

- Azure Function Apps
- Azure SQL
- Azure AI Search
- Azure API Management Service
- Azure Blob Storage
- Azure OpenAI Service
- Azure WebPubSubService

The following sections will walk-through the creation process of each
feature above; this entire section must be done before moving on to
the next step any of the guides.

#### Resource Group

A resource group contains all of the resources you will create for
DiagnoseAI.

1. Navigate to the [Azure Portal](https://portal.azure.com).
2. Search "Resource Groups" on the services search bar, and click on
   it.
   ![]()
3. Click on the "+ Create" button.
   ![]()
4. Fill in a memorable name for the resource group, and choose your
   closest region. For all mentions of a resource group from here on
   out, the guide will refer to this very group.
   ![]()

#### Azure Function Apps

1. Navigate to the [Azure Portal](https://portal.azure.com).
2. Search "Function App" on the services search bar, and click on it.
   ![]()
3. Click "Create".
   ![]()
4. Select

#### Azure SQL

#### Azure AI Search

#### Azure API Management Service

#### Azure Blob Storage

#### Azure OpenAI Service

#### Azure WebPubSubService

Return to [Guide](#guide).

----

## Configuring Local Development

Create a JSON file called `core/local.settings.json`.

``` json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "AzureWebJobsSecretStorageType": "files",
    "BlobBindingConnection": "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;",
    "DocumentEndpoint": "",
    "DocumentKey": "",
    "OpenAIEndpoint": "",
    "OpenAIKey": "",
    "CognitiveSearchEndpoint": "",
    "CognitiveSearchKey": ""
    "WebPubSubConnectionString": "",
    "WebPubSubHubName": "chat",
    "DatabaseURL": "",
    "DatabaseName": "",
    "DatabaseUsername": "",
    "DatabasePassword": "",
    "DatabaseSelfSigned": true,
    "ImageBlobConnectionString": "",
    "ImageBlobContainer": "",
  }
}
```

The endpoint and keys should be self-explanatory.

**Important**: To get proper linting, you must install the current
package: `pip install -e .` See [this StackOverflow
answer](https://stackoverflow.com/a/50193944) for why this is required.

## Installing developer dependencies

`core/requirements.txt` are the dependencies required for the Azure
functions, while `requirements-dev.txt` are for the developers. The
latter includes tools such as:

- `pylint`
- `mypy`
- `flake8`

## Running Tests

Before continuing, ensure all dependencies, and `pip install -e .` has
been run on the project root directory.

Then, to run tests, navigate to the the `core` directory. The
following command will run the test:

``` text
python3 -m unittest discover test
```


## Running Azurite

For the most part, you will need to use some kind of storage
emulator. This is where `azurite` comes into play.

First, start the storage emulator:

``` shell
azurite --silent --location /tmp/azurite --debug /tmp/azurite/debug.log
```

Azurite uses the following connection string for all the types of
resources that it emulates:

``` text
DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;
```

Then, on another terminal, create the respective containers:

``` text
az storage container create -n validation-documents --connection-string "<connection string here>"
```

To upload files / interact with the `azurite` blob, use the `az
storage blob` commands.

``` text
az storage blob upload -f something.txt -c validation-documents -n something.txt --connection-string "<connection string here>"
```

## Running MSSQL

Since we're using SQL on Azure, it's likely that we'll be using
MSSQL. When running tests related to the database,
e.g. `chat_connection` or `chat_history`, you will have to run a local
installation of an SQL server, ideally MSSQL.

``` text
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Strong@Passw0rd123!" -p 1433:1433 -d mcr.microsoft.com/mssql/server
```

Remember to update the `DatabaseURL`, `DatabaseName`,
`DatabaseUsername`, `DatabasePassword`, and `DatabaseSelfSigned`
fields in `local.settings.json`:

- `DatabaseURL`: probably `127.0.0.1`
- `DatabaseName`: probably `db`
- `DatabaseUsername`: `SA`
- `DatabasePassword`: `Strong%40Passw0rd123!`
- `DatabaseSelfSigned`: true

> **Important**: Ensure to unset `DatabaseSelfSigned` in production.

If you're running the function locally (e.g. `func start --functions
chat_history`), you will also need to install `odbc` tools:

``` text
curl https://packages.microsoft.com/keys/microsoft.asc | sudo tee /etc/apt/trusted.gpg.d/microsoft.asc \
curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list \
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql17
```

For other distributions / operating systems, please refer to [this
link](https://learn.microsoft.com/en-us/sql/linux/sql-server-linux-setup-tools?view=sql-server-ver16&tabs=ubuntu-install).

Then, create the _database_ (this is not done automatically in the
code because the SQL instance on Azure should already come with a
database name):

``` text
docker exec -it <container name> bash -c "/opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P Strong@Passw0rd123!"
1> CREATE DATABASE db;
2> GO
```

## Running the functions locally

Most of the functions written here can be run locally after running
[Azurite](#azurite), run the following command within `core/`:

``` text
func start
```

Then, start uploading starting to begin the process.

## Deploying

In the `core/` folder, run:


``` text
func azure functionapp publish <function app name>
```

In our environment, this is currently `diagnose-ai-core`.
