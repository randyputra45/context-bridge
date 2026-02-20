# connectors/rest_connector.py
import asyncio
import requests
from connectors.base import BaseConnector

class RESTConnector(BaseConnector):
    def __init__(self, name, config):
        super().__init__(name, config)
        self.base_url = config["base_url"]
        self.timeout = float(config.get("timeout", 8.0))

    def schema(self):
        """
        Return endpoints as a dict keyed by route, regardless of input shape.
        Accepts either:
          - dict form:
              {
                "/customers": {"method": "GET", "params": ["name","region"]},
                ...
              }
          - list form:
              [
                {"route": "/customers", "method": "GET", "params": ["name","region"]},
                {"path": "/tickets",   "method": "GET", "params": ["client","status"]},
                ...
              ]
        """
        eps = self.config.get("endpoints", {})
        if isinstance(eps, dict):
            # Normalize methods/params casing just in case
            out = {}
            for route, spec in eps.items():
                if not isinstance(spec, dict):
                    continue
                method = str(spec.get("method", "GET")).upper()
                params = list(spec.get("params", []))
                out[str(route)] = {"method": method, "params": params}
            return out

        # If provided as a list, normalize to dict
        if isinstance(eps, list):
            out = {}
            for e in eps:
                if not isinstance(e, dict):
                    continue
                route = (e.get("route") or e.get("path") or "").strip()
                if not route:
                    continue
                method = str(e.get("method", "GET")).upper()
                params = list(e.get("params", []))
                out[route] = {"method": method, "params": params}
            return out

        # Fallback
        return {}

    def execute(self, query: str):
        """
        Executes REST GET requests.
        Accepts slightly malformed queries like '/customers' or 'customers?region=EU'.
        """
        q = (query or "").strip()

        # Fallbacks for common malformed cases
        if not q.upper().startswith("GET"):
            if q.startswith("/"):
                q = "GET " + q
            else:
                q = "GET /" + q

        # Safe split
        parts = q.split(" ", 1)
        if len(parts) == 1:
            # Only path provided
            method, path = "GET", parts[0]
        else:
            method, path = parts

        if method.upper() != "GET":
            raise ValueError(f"Unsupported method: {method}")

        # Ensure path begins with /
        if not path.startswith("/"):
            path = "/" + path

        url = self.base_url + path
        print(f"[RESTConnector] Raw query from builder: {q!r} -> URL: {url}")

        r = requests.get(url, timeout=self.timeout)
        r.raise_for_status()

        try:
            return r.json()
        except Exception:
            # fallback: some mock APIs return plain text
            return [{"response": r.text}]

    # --- Minimal async support: run the same sync code in a worker thread ---
    async def execute_async(self, query: str):
        """Async wrapper around execute(), using a background thread."""
        return await asyncio.to_thread(self.execute, query)
