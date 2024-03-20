# DiagnoseAI End-to-End (E2E) tests

**Extremely important note:** The E2E tests will **NOT** work on the
Electron browser. Clerk's `/environment` endpoint expects an origin
header, which Electron will not send. Use another browser instead
(e.g. Firefox / Chrome).

**Extremely important note 2:** Make sure your IP address is
whitelisted on the Azure DB instance, if you're testing with a real
Azure DB instance.

This repoository contains the tests for DiagnoseAI. It exists as a
separate repository (in the case of the ZIP submission for the
relevant coursework, a separate folder) from the other components of
DiagnoseAI, because the systems test work across multiple components.

Please ensure that you are in an environment where you have network
access to Azure where Core API is fully deployed, and a local
environment with Uploader running on `localhost:3000` and WebApp
running on `localhost:3001`.

Additionally, you will also need Clerk credentials; configure it in
`cypress.env.json`:

``` json
{
  "test_email": "email_to_test",
  "test_password": "password_to_test",
  "clerk_origin": "https://xdx-100.accounts.dev"
}
```

where `test_email` and `test_password` are the designated credentials
for E2E tests, while `clerk_origin` is the URL to the clerk instance.

Install the pre-requisites:

``` shell
npm install
```

Running the tests:

``` shell
npm run test
```
