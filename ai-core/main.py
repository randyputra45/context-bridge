# main.py
import yaml
from connectors.sql_connector import SQLConnector
from connectors.rest_connector import RESTConnector

# Load config
with open("connectors/connectors.yaml", "r") as f:
    config = yaml.safe_load(f)["connectors"]

# Instantiate connectors
sql_conf = config["sql_connector"]
rest_conf = config["rest_connector"]

sql_conn = SQLConnector("SQLConnector", sql_conf)
rest_conn = RESTConnector("RESTConnector", rest_conf)

print("\n🔍 SQL SCHEMA:")
print(sql_conn.schema())

print("\n🔍 REST ENDPOINTS:")
print(rest_conn.schema())

print("\n🧮 Running SQL query...")
sql_query = "SELECT client, amount, status FROM invoices WHERE status='unpaid';"
print(sql_conn.execute(sql_query))

print("\n🌐 Running REST query...")
rest_query = "GET /customers?region=Europe"
print(rest_conn.execute(rest_query))
