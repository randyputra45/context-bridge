# main_query_test.py
import yaml
from builder.query_builder import LLMQueryBuilder
from connectors.sql_connector import SQLConnector
from connectors.rest_connector import RESTConnector

# Load config
with open("connectors/connectors.yaml", "r") as f:
    config = yaml.safe_load(f)["connectors"]

sql_conf = config["sql_connector"]
rest_conf = config["rest_connector"]

sql_conn = SQLConnector("SQLConnector", sql_conf)
rest_conn = RESTConnector("RESTConnector", rest_conf)
builder = LLMQueryBuilder()

# Example 1: Build SQL query
user_query_1 = "Show unpaid invoices for ACME Corp"
sql_query = builder.build_query(user_query_1, sql_conn.schema(), "sql")
print("\n🧮 Generated SQL query:")
print(sql_query)
print("Result:", sql_conn.execute(sql_query))

# Example 2: Build REST query
user_query_2 = "List customers in Europe"
rest_query = builder.build_query(user_query_2, rest_conn.schema(), "rest")
print("\n🌐 Generated REST query:")
print(rest_query)
print("Result:", rest_conn.execute(rest_query))
