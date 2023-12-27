# Diagnose AI Core

This is the repository for the Diagnose AI core component.

## Installing Azure Functions Core Tools

Run the following commands:

```
# This installs `func`, which is required to develop
# There is a way to do it without sudo, but you'll have to specify
# your own NPM path.

sudo npm install -g azure-functions-core-tools@4 --unsafe-perm true
sudo npm install -g azurite
```

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
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql18
```

For other distributions / operating systems, please refer to [this
link](https://learn.microsoft.com/en-us/sql/linux/sql-server-linux-setup-tools?view=sql-server-ver16&tabs=ubuntu-install).

Then, create the _database_ (this is not done automatically in the
code because the SQL instance on Azure should already come with a
database name):

``` text
docker exec -it <container name> -- bash -c /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P Strong@Passw0rd123!
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
