# connectors/base.py
from abc import ABC, abstractmethod

class BaseConnector(ABC):
    """Abstract base class for all connectors."""

    def __init__(self, name: str, config: dict):
        self.name = name
        self.config = config

    @abstractmethod
    def schema(self) -> dict:
        """Return the schema or endpoint structure."""
        pass

    @abstractmethod
    def execute(self, query: str):
        """Execute a validated query (SQL or REST call)."""
        pass
