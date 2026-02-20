# orchestrator/orchestrator.py
import uuid
import yaml
from typing import Dict, Any
import asyncio
from builder.query_builder import LLMQueryBuilder
from indexer.indexer import ContextIndexer
import time
import traceback

class ContextOrchestrator:
    """
    Core middleware orchestrator.

    1. Uses LLMQueryBuilder to generate SQL/REST queries per connector.
    2. Executes connectors concurrently.
    3. Transforms structured data into textual documents.
    4. Builds embeddings + stores them in FAISS.
    5. Retrieves relevant snippets (context selection).
    6. Returns a unified context pack to the API server.
    """

    def __init__(
        self,
        query_builder: LLMQueryBuilder,
        connectors: Dict[str, Any],
        profiles_dir: str = "orchestrator/profiles",
        max_concurrency: int = 8,
        per_connector_limit: int = 3,
        overall_timeout: float = 7.0,
    ):
        self.builder = query_builder
        self.connectors = connectors
        self.profiles_dir = profiles_dir
        self.sem_global = asyncio.Semaphore(max_concurrency)
        self.sems = {name: asyncio.Semaphore(per_connector_limit) for name in connectors.keys()}
        self.overall_timeout = overall_timeout

        # Context indexer (textification + FAISS embedding)
        self.indexer = ContextIndexer(self.builder)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _load_profile(self, profile_id: str) -> dict:
        """
        Loads a profile YAML file that defines allowed sources and merge strategy.
        """
        try:
            with open(f"{self.profiles_dir}/{profile_id}.yaml", "r") as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            return {"allowed_sources": list(self.connectors.keys()), "merge_strategy": "union"}

    async def _exec_one(self, source: str, ctype: str, schema: dict, user_query: str, conn=None):
        """
        Always returns: (source, query, rows, latency_ms, error_str)
        Never raises. This is an async coroutine in ALL paths.
        """
        conn = conn or self.connectors[source]
        t0 = time.time()
        q, rows, err = "", [], None

        try:
            q = self.builder.build_query(user_query, schema, ctype)
            print(f"[Orch] Generated query for {source}:\n{q}")
            q = self.builder._validate_query(ctype, q)

            # ✅ No-op early return still inside async def (OK to return the tuple)
            if q.startswith("-- NO SQL QUERY POSSIBLE") or q.startswith("-- NO API CALL POSSIBLE"):
                ms = int((time.time() - t0) * 1000)
                return (source, q, [], ms, None)

            # Execute with timeout
            if hasattr(conn, "execute_async"):
                rows = await asyncio.wait_for(conn.execute_async(q), timeout=getattr(self, "per_source_timeout", 15))
            else:
                rows = await asyncio.wait_for(asyncio.to_thread(conn.execute, q), timeout=getattr(self, "per_source_timeout", 15))

        except asyncio.TimeoutError:
            err = f"Timeout after {getattr(self, 'per_source_timeout', 15)}s"
        except Exception as e:
            err = f"{type(e).__name__}: {e}"

        ms = int((time.time() - t0) * 1000)
        return (source, q, [] if err else rows, ms, err)





    def _detect_type(self, schema: dict) -> str:
        """
        Simple heuristic to decide connector type from its schema.
        """
        for v in schema.values():
            if "fields" in v:
                return "sql"
            if "params" in v:
                return "rest"
        return "sql"

    # ------------------------------------------------------------------
    # Main orchestration logic
    # ------------------------------------------------------------------

    async def run_async(
        self,
        user_query: str,
        profile_id: str,
        user: dict | None = None,
        connectors_override = None,
    ) -> dict:
        # Use per-request connectors when present; otherwise the default YAML-loaded ones
        connectors = connectors_override or self.connectors

        # Decide which sources to use
        if connectors_override:
            # Caller controls the set → use ALL provided connectors, no profile filtering
            profile = {"id": profile_id}
            allowed = list(connectors.keys())
        else:
            # Fall back to profile rules from YAML
            profile = self._load_profile(profile_id)
            allowed_in_profile = profile.get("allowed_sources", list(connectors.keys()))
            # keep only sources that actually exist in this connectors set
            allowed = [s for s in allowed_in_profile if s in connectors]

        trace_id = str(uuid.uuid4())
        notes: list[str] = []

        # 0) Seed passive sources (files, etc.) — once, no LLM, no execute()
        for src in allowed:
            conn = connectors[src]
            if getattr(conn, "is_passive", False):
                try:
                    if hasattr(conn, "list_all_async"):
                        rows = await conn.list_all_async()
                    else:
                        rows = await asyncio.to_thread(conn.list_all)
                    schema_txt = self._format_schema(conn.schema())
                    self.indexer.seed_static_corpus(src, rows, schema_txt)
                except Exception as e:
                    # Passive failures shouldn't break the request
                    notes.append(f"{src} passive seed error: {type(e).__name__}: {e}")

        # 1) Create tasks ONLY for active (non-passive) sources
        tasks: list[asyncio.Task] = []
        for src in allowed:
            conn = connectors[src]
            if getattr(conn, "is_passive", False):
                continue
            schema = conn.schema()
            ctype = self._detect_type(schema)
            # pass the connector explicitly so _exec_one doesn't read self.connectors
            coro = self._exec_one(src, ctype, schema, user_query, conn=conn)
            if not asyncio.iscoroutine(coro):
                # extremely defensive: should never happen if _exec_one is async
                async def _wrap_immediate(v): return v
                coro = _wrap_immediate(coro)
            tasks.append(asyncio.create_task(coro))

        # 2) Wait with timeout and collect partials
        results = []
        if tasks:
            done, pending = await asyncio.wait(tasks, timeout=self.overall_timeout)
            for t in done:
                try:
                    results.append(t.result())
                except Exception as e:
                    results.append(("unknown", "", [], 0, f"{type(e).__name__}: {e}"))
            for t in pending:
                t.cancel()

        # 3) Structured results from active sources
        structured_results: dict[str, list[dict]] = {}
        schemas: dict[str, str] = {}
        citations: list[dict] = []
        queries: dict[str, str] = {}

        for tup in results:
            # expect (source, q, rows, ms, err)
            if not isinstance(tup, (list, tuple)) or len(tup) != 5:
                notes.append("malformed result from a source (expected 5-tuple)")
                continue
            src, q, rows, ms, err = tup
            try:
                schema = connectors[src].schema()
                schemas[src] = self._format_schema(schema)
            except Exception as e:
                schemas[src] = ""
                notes.append(f"{src} schema collect error: {type(e).__name__}: {e}")

            if q:
                queries[src] = q
            if err:
                notes.append(f"{src} error: {err}")
            else:
                structured_results[src] = rows or []
                citations.append({"source": src, "query": q, "latency_ms": int(ms)})

        # 4) Index active-source rows (passives already seeded)
        try:
            self.indexer.index_results(
                user_query,
                structured_results,
                schemas,
                queries_by_source=queries,
            )
        except Exception as e:
            notes.append(f"index_results error: {type(e).__name__}: {e}")

        # 5) Retrieve top-K contextual items (text + meta)
        try:
            items = self.indexer.retrieve_context_items(user_query, top_k=10)
        except Exception as e:
            notes.append(f"retrieve_context_items error: {type(e).__name__}: {e}")
            items = []

        snippets = [it.get("text", "") for it in items]
        context_text = "\n".join(snippets)

        # 6) Citations ONLY from retrieved items (meta-aware)
        filtered_citations: list[dict] = []
        try:
            for it in items:
                meta = it.get("meta") or {}
                src  = meta.get("source", "unknown")
                if meta.get("type") in ("files", "files_summary"):
                    entry = {"source": src}
                    if meta.get("file"): entry["file"] = meta["file"]
                    if meta.get("loc"):  entry["loc"]  = meta["loc"]
                    filtered_citations.append(entry)
                else:
                    q = queries.get(src, "")
                    filtered_citations.append({"source": src, "query": q})

            # dedupe
            seen, dedup_citations = set(), []
            for c in filtered_citations:
                key = tuple(sorted(c.items()))
                if key in seen:
                    continue
                seen.add(key)
                dedup_citations.append(c)
            citations = dedup_citations
        except Exception as e:
            notes.append(f"citations build error: {type(e).__name__}: {e}")
            citations = []

        # 7) Timing
        elapsed_ms = sum(
            c.get("latency_ms", 0) for c in citations
            if isinstance(c, dict) and "latency_ms" in c
        )

        return {
            "trace_id": trace_id,
            "context": context_text,
            "snippets": snippets,
            "citations": citations,
            "queries": queries,
            "notes": notes,
            "elapsed_ms": elapsed_ms,
        }





    # ------------------------------------------------------------------
    # Utilities
    # ------------------------------------------------------------------

    def _format_schema(self, schema: dict) -> str:
        """
        Converts connector schema to plain text for LLM prompts.
        """
        lines = []
        for name, detail in schema.items():
            if "fields" in detail:
                fields = ", ".join(detail["fields"])
                lines.append(f"{name}({fields})")
            elif "params" in detail:
                params = ", ".join(detail["params"])
                lines.append(f"{name}?{params}")
        return "\n".join(lines)
