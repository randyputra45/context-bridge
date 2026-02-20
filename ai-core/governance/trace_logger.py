# governance/trace_logger.py
"""
Trace logger for ContextBridge.
- Supports SQLite (recommended) or JSONL fallback.
- Minimal dependency (stdlib only).

Usage:
    from governance.trace_logger import init_logger, log_trace, get_trace, list_traces

    init_logger(backend="sqlite", path="data/traces.db")
    tid = log_trace({...})
    t = get_trace(tid)
    recent = list_traces(limit=20)

Environment overrides:
    TRACE_BACKEND = "sqlite" | "jsonl"
    TRACE_PATH    = "data/traces.db" (sqlite) or "data/traces.jsonl" (jsonl)
"""

from __future__ import annotations
import os
import json
import sqlite3
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

# ---------- configuration ----------

_DEFAULT_BACKEND = os.getenv("TRACE_BACKEND", "sqlite").lower()
_DEFAULT_PATH = os.getenv(
    "TRACE_PATH",
    "data/traces.db" if _DEFAULT_BACKEND == "sqlite" else "data/traces.jsonl"
)

# Singleton-ish global
_logger = None  # type: Optional[_BaseLogger]


def init_logger(backend: str = None, path: str = None) -> None:
    """
    Initialize the global logger.
    """
    global _logger
    backend = (backend or _DEFAULT_BACKEND).lower()
    path = path or _DEFAULT_PATH

    if backend not in ("sqlite", "jsonl"):
        raise ValueError("backend must be 'sqlite' or 'jsonl'")

    if backend == "sqlite":
        _logger = _SQLiteLogger(path)
    else:
        _logger = _JSONLLogger(path)


def _ensure_logger():
    global _logger
    if _logger is None:
        init_logger()  # lazy init with defaults
    return _logger

# ---------- models ----------

def _now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"

# ---------- public API ----------

def log_trace(data: Dict[str, Any]) -> str:
    """
    Persist a trace and return the trace_id.
    'data' should be a dict like:
        {
          "trace_id": optional[str],
          "user": "alice@corp",
          "query": "Show unpaid invoices for ACME",
          "profile": "sales_reply",
          "queries": {"sql_connector": "...", "rest_connector": "..."},
          "citations": [{"source":"sql_connector","query":"..."}, ...],
          "context": " • client: ACME; amount: 1200 ...",
          "model": "llama3",
          "answer": "ACME owes 1200. Sources: ...",
          "elapsed_ms": 1234
        }
    """
    logger = _ensure_logger()
    # Fill defaults
    trace_id = data.get("trace_id") or str(uuid.uuid4())
    record = {
        "trace_id": trace_id,
        "ts": data.get("ts") or _now_iso(),
        "user": data.get("user"),
        "query": data.get("query"),
        "profile": data.get("profile"),
        "queries": data.get("queries") or {},
        "citations": data.get("citations") or [],
        "context": data.get("context"),
        "model": data.get("model"),
        "answer": data.get("answer"),
        "elapsed_ms": int(data.get("elapsed_ms") or 0),
    }
    logger.write(record)
    return trace_id


def get_trace(trace_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch a single trace by id.
    """
    logger = _ensure_logger()
    return logger.read(trace_id)


def list_traces(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """
    List recent traces (most recent first).
    """
    logger = _ensure_logger()
    return logger.list(limit=limit, offset=offset)

# ---------- logger backends ----------

class _BaseLogger:
    def write(self, record: Dict[str, Any]) -> None:
        raise NotImplementedError

    def read(self, trace_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def list(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        raise NotImplementedError


class _SQLiteLogger(_BaseLogger):
    def __init__(self, path: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.path = path
        self._init_db()

    def _conn(self):
        return sqlite3.connect(self.path)

    def _init_db(self):
        with self._conn() as con:
            con.execute("""
                CREATE TABLE IF NOT EXISTS traces (
                    trace_id    TEXT PRIMARY KEY,
                    ts          TEXT,
                    user        TEXT,
                    query       TEXT,
                    profile     TEXT,
                    queries     TEXT,  -- JSON
                    citations   TEXT,  -- JSON
                    context     TEXT,
                    model       TEXT,
                    answer      TEXT,
                    elapsed_ms  INTEGER
                );
            """)
            con.execute("CREATE INDEX IF NOT EXISTS idx_traces_ts ON traces(ts);")

    def write(self, record: Dict[str, Any]) -> None:
        with self._conn() as con:
            con.execute("""
                INSERT OR REPLACE INTO traces
                (trace_id, ts, user, query, profile, queries, citations, context, model, answer, elapsed_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                record.get("trace_id"),
                record.get("ts"),
                record.get("user"),
                record.get("query"),
                record.get("profile"),
                json.dumps(record.get("queries") or {}, ensure_ascii=False),
                json.dumps(record.get("citations") or [], ensure_ascii=False),
                record.get("context"),
                record.get("model"),
                record.get("answer"),
                int(record.get("elapsed_ms") or 0),
            ))

    def read(self, trace_id: str) -> Optional[Dict[str, Any]]:
        with self._conn() as con:
            cur = con.execute("SELECT * FROM traces WHERE trace_id = ?;", (trace_id,))
            row = cur.fetchone()
            if not row:
                return None
            cols = [d[0] for d in cur.description]
            rec = dict(zip(cols, row))
            # de-jsonify
            rec["queries"]   = json.loads(rec.get("queries") or "{}")
            rec["citations"] = json.loads(rec.get("citations") or "[]")
            return rec

    def list(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        with self._conn() as con:
            cur = con.execute("""
                SELECT * FROM traces
                ORDER BY ts DESC
                LIMIT ? OFFSET ?;
            """, (int(limit), int(offset)))
            cols = [d[0] for d in cur.description]
            out: List[Dict[str, Any]] = []
            for row in cur.fetchall():
                rec = dict(zip(cols, row))
                rec["queries"]   = json.loads(rec.get("queries") or "{}")
                rec["citations"] = json.loads(rec.get("citations") or "[]")
                out.append(rec)
            return out


class _JSONLLogger(_BaseLogger):
    def __init__(self, path: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.path = path
        # also make an index file for quick lookups
        self.idx_path = self.path + ".index.json"

        if not os.path.exists(self.idx_path):
            with open(self.idx_path, "w", encoding="utf-8") as f:
                json.dump({}, f)

    def _load_index(self) -> Dict[str, int]:
        try:
            with open(self.idx_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _save_index(self, idx: Dict[str, int]) -> None:
        with open(self.idx_path, "w", encoding="utf-8") as f:
            json.dump(idx, f, ensure_ascii=False)

    def write(self, record: Dict[str, Any]) -> None:
        # append line & update index with byte offset
        line = json.dumps(record, ensure_ascii=False) + "\n"
        with open(self.path, "ab") as f:
            pos = f.tell()
            f.write(line.encode("utf-8"))
        idx = self._load_index()
        idx[record["trace_id"]] = pos
        self._save_index(idx)

    def read(self, trace_id: str) -> Optional[Dict[str, Any]]:
        idx = self._load_index()
        pos = idx.get(trace_id)
        if pos is None:
            return None
        with open(self.path, "rb") as f:
            f.seek(pos)
            line = f.readline().decode("utf-8")
            return json.loads(line)

    def list(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        # simple scan newest -> oldest by reading all and sorting on ts
        if not os.path.exists(self.path):
            return []
        rows: List[Dict[str, Any]] = []
        with open(self.path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    rows.append(json.loads(line))
                except Exception:
                    continue
        rows.sort(key=lambda r: r.get("ts", ""), reverse=True)
        return rows[offset: offset + limit]
