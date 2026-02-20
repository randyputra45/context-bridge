# builder/query_builder.py
import os
import re
import json
import requests
from builder.prompt_templates import SQL_PROMPT_TEMPLATE, REST_PROMPT_TEMPLATE

class LLMQueryBuilder:
    """
    Translates natural language into SQL or REST queries using a local LLM via Ollama.
    - Endpoint: http://localhost:11434
    - Model: 'llama3.2:1b' by default (set OLLAMA_MODEL / OLLAMA_ENDPOINT to override)
    """

    def __init__(self, model: str = None, endpoint: str = None):
        self.endpoint = endpoint or os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3.2:1b")
        self.chat_url = f"{self.endpoint}/api/chat"

    # ---------- helpers ----------

    def _read_schema(self, schema_dict: dict) -> str:
        """Format schema dict into an LLM-friendly text block."""
        lines = []
        for name, details in schema_dict.items():
            if "fields" in details:
                fields = ", ".join(details["fields"])
                lines.append(f"{name}({fields})")
            elif "params" in details:
                params = ", ".join(details["params"])
                # REST endpoints may be keys like '/customers'; reflect that
                lines.append(f"{name}?{params}")
        return "\n".join(lines)

    def _extract_query_text(self, raw: str, connector_type: str) -> str:
        """
        Strip code fences / explanations and return the first valid SQL (SELECT ...)
        or REST (GET /...) line.
        """
        text = raw.strip()

        # Remove markdown code fences if present
        text = re.sub(r"^```[a-zA-Z0-9]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

        # Collapse triple backtick blocks appearing inline
        text = re.sub(r"```.*?```", lambda m: m.group(0).replace("```", ""), text, flags=re.S)

        # Split into lines and find the first that matches our pattern
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        if connector_type == "sql":
            for ln in lines:
                # Keep only the part before a trailing semicolon comment if any
                ln = ln.split("--")[0].strip()
                if re.match(r"(?i)^select\b", ln):
                    return ln if ln.endswith(";") else (ln + ";")
        elif connector_type == "rest":
            for ln in lines:
                if re.match(r"(?i)^get\s+/", ln):
                    return ln

        # As a fallback, if the whole text looks like a single-line query, return it
        if connector_type == "sql" and re.match(r"(?i)^select\b", text):
            return text if text.endswith(";") else (text + ";")
        if connector_type == "rest" and re.match(r"(?i)^get\s+/", text):
            return text

        # Nothing valid found
        return raw.strip()

    def _call_ollama(self, system_prompt: str, user_prompt: str) -> str:
        """
        Call Ollama's chat API. Prefer non-streaming; if server streams NDJSON anyway,
        parse it line-by-line and join message chunks.
        """
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "options": {"temperature": 0.0},
            "stream": False,  # <<<<<< IMPORTANT: request a single JSON response
        }
        r = requests.post(self.chat_url, json=payload, timeout=120)
        r.raise_for_status()

        # Try single JSON first
        try:
            data = r.json()
            if isinstance(data, dict) and "message" in data:
                return data["message"]["content"].strip()
        except requests.JSONDecodeError:
            pass  # Fall through to NDJSON parsing

        # NDJSON fallback (streamed style): parse each JSON line and concatenate contents
        chunks = []
        for line in r.iter_lines(decode_unicode=True):
            if not line:
                continue
            try:
                obj = json.loads(line)
                msg = obj.get("message", {}).get("content")
                if msg:
                    chunks.append(msg)
            except json.JSONDecodeError:
                # Ignore non-JSON lines
                continue
        if chunks:
            return "".join(chunks).strip()

        # Last resort: return raw text
        return r.text.strip()

    def _validate_query(self, connector_type: str, query: str) -> str:
        """
        Safety guard: enforce read-only operations.
        - SQL: must start with SELECT, or allow safe fallback marker.
        - REST: must start with GET, or allow safe fallback marker.
        """
        q = query.strip()

        # ✅ Allow safe fallback markers from LLM
        if q.startswith("-- NO SQL QUERY POSSIBLE") or q.startswith("-- NO API CALL POSSIBLE"):
            return q

        if connector_type == "sql":
            head = q.lower().split(None, 1)[0] if q else ""
            if head != "select":
                raise ValueError(f"Unsafe SQL (only SELECT allowed). Got: {q[:100]}...")

        elif connector_type == "rest":
            if not re.match(r"(?i)^get\s+/", q):
                raise ValueError(f"Unsafe REST (only GET allowed). Got: {q[:100]}...")

        else:
            raise ValueError("Unsupported connector type.")

        return q



    # ---------- public API ----------

    def build_query(self, user_query: str, schema_dict: dict, connector_type: str) -> str:
        """
        Generate a SQL or REST query using a local LLM through Ollama.
        """
        schema_text = self._read_schema(schema_dict)

        if connector_type == "sql":
            system = "You write safe, read-only SQL queries (SELECT only). Output ONLY the SQL, no explanations."
            user = SQL_PROMPT_TEMPLATE.format(user_query=user_query, schema=schema_text)
            print(user)
        elif connector_type == "rest":
            system = "You write REST GET requests. Output ONLY the HTTP request line, no explanations."
            user = REST_PROMPT_TEMPLATE.format(user_query=user_query, schema=schema_text)
            #print(user)
        else:
            raise ValueError("Unsupported connector type (use 'sql' or 'rest').")

        raw = self._call_ollama(system_prompt=system, user_prompt=user)
        extracted = self._extract_query_text(raw, connector_type)
        return self._validate_query(connector_type, extracted)
