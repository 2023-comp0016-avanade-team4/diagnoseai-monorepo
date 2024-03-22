#!/bin/bash
# Entrypoint for integration tests. Assumes that the following on the system:
# 1) MSSQL, configured such that the username is SA, the password is
#    P@ssw0rd123, and the database is testdb.
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
echo "DROP DATABASE testdb; CREATE DATABASE testdb;" > /tmp/create_db.sql
/opt/mssql-tools/bin/sqlcmd -S db -U SA -P password123! -i /tmp/create_db.sql
python3 -m unittest discover integration_tests
popd

sleep 1000m
