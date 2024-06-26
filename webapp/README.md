# DiagnoseAI WebApp

This folder contains the `WebApp` component. This is a reference
implementation of an instance that can interact with DiagnoseAI.

## Running locally

Install the dependencies:

``` bash
npm install
```

Configure environment variables by creating a file `.env` in _this_ folder.

``` text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
OCP_APIM_SUBSCRIPTION_KEY=""
CHAT_CONNECTION_URL=<core_url>/core/chat_connection
CHAT_HISTORY_URL=<core_url>/core/chat_history
WORK_ORDERS_URL=<core_url>/core/work_order
CHAT_DONE_URL=<core_url>/core/chat_done
```

Run the server:

``` bash
npm run dev
```

## Tests

This repository contains 6 integration tests and 30 unit tests. Run the
tests with the following:

``` bash
npm run test
```

## End-to-End Tests

Please see `../e2e`.

## Continuous Integration

From the root directory of this repository (i.e. one folder up), check
`.github/workflows/deploy-webapp.yml`.

If you are deploying with this current directory structure, set the
secret
`AZUREAPPSERVICE_PUBLISHPROFILE_08B34313926748588707A4249E161EB8` to
the publish profile found on Azure App Service.

> **Note**: When selecting the deployment method on Azure App Service,
> make sure to use an _existing configuration_; do not let Azure App
> Service override the workflow file.
