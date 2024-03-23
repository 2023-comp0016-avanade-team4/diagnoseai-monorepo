# Integration Tests

All tests here assume that it is being run within
`docker-compose.tests.yml`. Although this is an integration test, it
still needs to mock most of the Azure services to remain as local as
possible.

The reason why we can't simply run `func start` and then perform tests
on that is due to the reliance on upstream Azure services, which we
may not have. The integration tests here simply checks for
interoperablity between some endpoints, and hence doesn't need the
full suite of Azure services.
