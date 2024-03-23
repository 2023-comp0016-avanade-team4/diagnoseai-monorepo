#!/bin/bash
# Entrypoint for integration tests. Assumes that the following on the system:
# 1) MSSQL, configured such that the username is SA, the password is
#    P@ssw0rd123. You do not need to create a database.
# 2) Python 3.10

curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
curl https://packages.microsoft.com/config/debian/10/prod.list > /etc/apt/sources.list.d/mssql-release.list
apt-get update
ACCEPT_EULA=Y apt-get install -y msodbcsql17
ACCEPT_EULA=Y apt-get install -y mssql-tools

pip install -r core/requirements.txt
pip install -e .

sleep 5s
pushd core/
python3 -m unittest discover integration_tests
popd

# NOTE: Uncomment this to debug
sleep 1000m
