# DiagnoseAI

This is the monorepository for DiagnoseAI.

DiagnoseAI is an interface-agnostic knowledge base built on Azure. It
aims to resolve knowledge and time costs associated to the vast
amounts of knowledge required to complete a tasking assigned to a
field engineer of any field.

Chat with DiagnoseAI, your pocket field expert, today.

## Deployment

Please refer to `core/README.md` for CoreAPI deployment
instructions. Subsequently, please refer to `uploader/README.md` and
`webapp/README.md` for deployment instructions for the Web
Applications.

## Tests

Core: 44 unit tests + 7 integration tests
WebApp: 30 unit tests + 6 integration tests
Uploader: 26 unit tests + 1 integration test

End-to-End: 6 end-to-end tests + 2 smoke tests

This repository has a total of **122** tests.

Please refer to the README of each sub-directory to run the respective
unit and integration tests.

Refer to `e2e/README.md` for instructions on how to run `end-to-end`
tests.

## Diagrams

Diagrams for visualization can be found under `./diagrams`

## Authors

- [@jameshi16](https://github.com/jameshi16)
- [@aadhikeaswar](https://github.com/aadhikeaswar)
- [@georgeg12](https://github.com/georgeg12)

## License

MIT License, see [License](/LICENSE).

## Deployments

These deployments are not guaranteed to stay online after
May 2024. While they are available right now, do note that you will
still need a valid user account to actually use the service.

- Uploader: https://diagnoseai-uploader.azurewebsites.net/
- WebApp: https://diagnoseai-webapp.azurewebsites.net/
