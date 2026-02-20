# connectors/sql_connector.py
import asyncio
from sqlalchemy import create_engine, text
from connectors.base import BaseConnector

class SQLConnector(BaseConnector):
    """Connector for relational databases (SQLite in this case)."""

    def __init__(self, name, config):
        super().__init__(name, config)
        self.engine = create_engine(config["connection_string"], echo=False)

    def schema(self):
        """Return schema info (for LLM QueryBuilder)."""
        return self.config.get("schema", {})

    def execute(self, query: str):
        """Execute a SQL SELECT query and return results."""
        if not query or not query.strip().lower().startswith("select"):
            raise ValueError("Only SELECT statements are allowed.")

        with self.engine.connect() as conn:
            result = conn.execute(text(query))
            columns = result.keys()
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
            return rows

    # --- Minimal async support: run the same sync code in a worker thread ---
    async def execute_async(self, query: str):
        """Async wrapper around execute(), using a background thread."""
        return await asyncio.to_thread(self.execute, query)
