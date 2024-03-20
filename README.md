# DiagnoseAI End-to-End (E2E) tests

This repoository contains the tests for DiagnoseAI. It exists as a
separate repository (in the case of the ZIP submission for the
relevant coursework, a separate folder) from the other components of
DiagnoseAI, because the systems test work across multiple components.

Please ensure that you are in an environment where you have network
access to Azure where Core API is fully deployed, and a local
environment with Uploader running on `localhost:3000` and WebApp
running on `localhost:3001`.

Additionally, you will also need Clerk credentials; configure it in
`cypress.env.jsson`:

``` json
{
  "test_email": "email_to_test",
  "test_password": "password_to_test"
}
```

Install the pre-requisites:

``` shell
npm install
```

Running the tests:

``` shell
npm run test
```
