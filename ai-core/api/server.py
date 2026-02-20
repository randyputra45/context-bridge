# api/server.py
from __future__ import annotations

import os
import time
import yaml
from typing import Dict, Any, Optional, List, Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# --- Core layers ---
from orchestrator.orchestrator import ContextOrchestrator
from builder.query_builder import LLMQueryBuilder            # uses Ollama HTTP API
from connectors.sql_connector import SQLConnector
from connectors.rest_connector import RESTConnector
from connectors.files_connector import FilesConnector
from llm_interface.llm_client import LLMClient               # uses Ollama HTTP API

# --- Governance (trace/audit) ---
from governance.trace_logger import (
    init_logger,
    log_trace,
    get_trace,
    list_traces,
)

# Optional sanitizer (if you created governance/sanitizer.py)
try:
    from governance.sanitizer import redact_pii
except Exception:  # pragma: no cover
    def redact_pii(text: str) -> str:
        return text  # no-op fallback


# ===============================
# App & Global Singletons
# ===============================

app = FastAPI(title="ContextBridge API", version="0.1.0")

# (Optional) Allow local UI / tools
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load connectors.yaml once
CONNECTORS_YAML_PATH = os.getenv("CB_CONNECTORS_YAML", "connectors/connectors.yaml")
try:
    _conf = yaml.safe_load(open(CONNECTORS_YAML_PATH, "r"))["connectors"]
except Exception as e:
    raise RuntimeError(f"Failed to load connectors YAML at {CONNECTORS_YAML_PATH}: {e}")

# Instantiate default (YAML) connectors
_connectors: Dict[str, Any] = {}
if "files_connector" in _conf:
    _connectors["files_connector"] = FilesConnector("files_connector", _conf["files_connector"])
if "sql_connector" in _conf:
    _connectors["sql_connector"] = SQLConnector("sql_connector", _conf["sql_connector"])
if "rest_connector" in _conf:
    _connectors["rest_connector"] = RESTConnector("rest_connector", _conf["rest_connector"])

# LLM-powered query builder (Ollama by default)
_builder = LLMQueryBuilder(
    model=os.getenv("OLLAMA_MODEL", "llama3.2:1b"),
    endpoint=os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434"),
)

# Orchestrator (glue)
_orch = ContextOrchestrator(_builder, _connectors)

# Reasoning LLM client for final answers (Ollama)
_llm = LLMClient(
    model=os.getenv("OLLAMA_MODEL", "llama3.2:1b"),
    endpoint=os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434"),
)


# ===============================
# Models (request/response + per-request connectors)
# ===============================

class ConnectorSpec(BaseModel):
    name: str
    type: Literal["sql", "rest", "files"]
    config: Dict[str, Any]

class QueryRequest(BaseModel):
    profile: List[str] = Field(..., description="List of orchestrator profile IDs (e.g., ['sales_reply', 'finance_summary'])")
    query: str = Field(..., description="User natural-language question")
    scopes: Optional[List[str]] = Field(default=None, description="User scopes/roles")
    connectors: Optional[List[ConnectorSpec]] = None  # per-request connectors (optional)


class QueryResponse(BaseModel):
    answer: str
    citations: List[dict]
    trace_id: str
    elapsed_ms: int


# ===============================
# Helpers
# ===============================

def build_connectors_from_specs(specs: List[ConnectorSpec]) -> Dict[str, Any]:
    """
    Build a transient connectors map from request-provided specs.
    Does NOT mutate global _connectors.
    """
    tmp: Dict[str, Any] = {}
    for s in specs:
        t = s.type.lower()
        if t == "sql":
            tmp[s.name] = SQLConnector(s.name, s.config)
        elif t == "rest":
            tmp[s.name] = RESTConnector(s.name, s.config)
        elif t == "files":
            tmp[s.name] = FilesConnector(s.name, s.config)
        else:
            raise ValueError(f"Unsupported connector type: {s.type}")
    return tmp


# ===============================
# Lifecycle
# ===============================

@app.on_event("startup")
def _startup():
    # Initialize the trace logger (SQLite by default)
    trace_backend = os.getenv("TRACE_BACKEND", "sqlite")
    trace_path = os.getenv("TRACE_PATH", "data/traces.db" if trace_backend == "sqlite" else "data/traces.jsonl")
    init_logger(backend=trace_backend, path=trace_path)


# ===============================
# Routes
# ===============================

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/schema")
async def schema():
    """Return schemas/endpoints of all configured (YAML) connectors."""
    out = {}
    for name, conn in _connectors.items():
        try:
            out[name] = conn.schema()
        except Exception as e:
            out[name] = {"error": str(e)}
    return out


@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest, request: Request):
    """
    Main endpoint:
      1) Orchestrator builds LLM-generated SQL/REST queries for allowed sources
      2) Connectors execute them; orchestrator merges into a context pack
      3) LLM answers using ONLY that context
      4) Trace is logged (queries, citations, timing)

    If req.connectors is provided, those connectors are used for this request only.
    Otherwise the YAML-loaded default connectors are used.
    """
    t0 = time.time()
    
    print("Received query request:", req)

    try:
        # Per-request connector override (optional; no global mutation)
        connectors_override = None
        if req.connectors:
            print(f"[API] request provided connectors: {[c.name for c in req.connectors]}")
            connectors_override = build_connectors_from_specs(req.connectors)
            print(f"[API] built override connectors: {list(connectors_override.keys())}")

            
        profile_str = ", ".join(req.profile)
        # 1) Orchestrate (generate source queries + fetch data + context)
        pack = await _orch.run_async(
            req.query,
            profile_str,
            user={},  # attach user context if you have it
            connectors_override=connectors_override,  # NEW
        )

        # 2) Privacy: sanitize context before sending to reasoning LLM
        safe_context = redact_pii(pack.get("context", ""))

        # 3) Ask reasoning LLM for final answer
        ans = _llm.ask(safe_context, req.query)

        # 4) Trace/Audit
        elapsed_ms = int((time.time() - t0) * 1000)
        trace_id = pack.get("trace_id", "")
        log_trace({
            "trace_id": trace_id,
            "query": req.query,
            "profile": profile_str,
            "queries": pack.get("queries", {}),
            "citations": pack.get("citations", []),
            "context": safe_context,
            "model": os.getenv("OLLAMA_MODEL", "llama3"),
            "answer": ans.get("answer", ""),
            "elapsed_ms": elapsed_ms,
        })

        return QueryResponse(
            answer=ans.get("answer", ""),
            citations=pack.get("citations", []),
            trace_id=trace_id,
            elapsed_ms=elapsed_ms
        )

    except HTTPException:
        raise
    except Exception as e:
        # Surface a friendly error to the client; logs are in the server console
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")


@app.get("/trace/{trace_id}")
async def read_trace(trace_id: str):
    rec = get_trace(trace_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Trace not found")
    return rec


@app.get("/traces")
async def list_recent_traces(limit: int = 50, offset: int = 0):
    try:
        return list_traces(limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
