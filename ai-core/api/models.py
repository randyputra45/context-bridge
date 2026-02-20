# api/models.py
from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel

class ConnectorSpec(BaseModel):
    name: str
    type: Literal["sql", "rest", "files"]
    info: Dict[str, Any]

class QueryRequest(BaseModel):
    profile: str
    query: str
    connectors: Optional[List[ConnectorSpec]] = None  # <-- NEW
