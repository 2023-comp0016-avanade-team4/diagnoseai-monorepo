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
  }
}
```

The endpoint and keys should be self-explanatory.

**Important**: To get proper linting, you must install the current
package: `pip install -e.` See [this StackOverflow
answer](https://stackoverflow.com/a/50193944) for why this is required.

## Installing developer dependencies

`core/requirements.txt` are the dependencies required for the Azure
functions, while `requirements-dev.txt` are for the developers. The
latter includes tools such as:

- `pylint`
- `mypy`
- `flake8`


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
