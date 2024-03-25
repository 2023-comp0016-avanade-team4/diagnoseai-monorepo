# DiagnoseAI Uploader

This folder contains the `Uploader` component. This is for experts to
upload documents to system.

## Running locally

Install the dependencies:

``` bash
npm install
```

Configure environment variables by creating a file `.env` in _this_ folder.

``` text
AZURE_STORAGE_CONNECTION_STRING=""
AZURE_STORAGE_CONTAINER_NAME="verification"
AZURE_COGNITIVE_SERVICE_ENDPOINT=""
AZURE_COGNITIVE_SERVICE_API_KEY=""
DB_HOST=""
DB_USER=""
DB_PASSWORD=""
DB_NAME=""
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
CHAT_CONNECTION_URL="<core_url>/core/chat_connection"
VALIDATE_URL="<core>/core/validation_to_production"
OCP_APIM_SUBSCRIPTION_KEY=""
```

Run the server:

``` bash
npm run dev
```

## Tests

This repository contains 1 integration test and 26 unit tests. Run the
tests with the following:

``` bash
npm run test
```

## End-to-End Tests

Please see `../e2e`.

## Continuous Integration

From the root directory of this repository (i.e. one folder up), check
`.github/workflows/deploy-uploader.yml`.

If you are deploying with this current directory structure, set the
secret
`AZUREAPPSERVICE_PUBLISHPROFILE_D372D82DF1E04CB799D468B30F080E38` to
the publish profile found on Azure App Service.

> **Note**: When selecting the deployment method on Azure App Service,
> make sure to use an _existing configuration_; do not let Azure App
> Service override the workflow file.
