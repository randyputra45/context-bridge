import os
import time
import requests
import streamlit as st
from typing import Dict, Any, List

# =========================
# Sidebar: Settings
# =========================
st.set_page_config(page_title="ContextBridge UI", page_icon="🧠", layout="wide")

def get_env(name: str, default: str) -> str:
    v = os.getenv(name, "").strip()
    return v or default

st.sidebar.title("⚙️ Settings")

API_BASE = st.sidebar.text_input("API Base URL", value=get_env("CB_API_BASE", "http://localhost:8080"))
DEFAULT_PROFILE = st.sidebar.text_input("Default Profile", value=get_env("CB_DEFAULT_PROFILE", ["sales_reply"]))
USER_ID = st.sidebar.text_input("User Id (X-User header)", value=get_env("CB_USER", "demo"))
USER_SCOPES = st.sidebar.text_input("Scopes (comma-separated)", value=get_env("CB_SCOPES", ""))

st.sidebar.markdown("---")
st.sidebar.caption("Tip: set env vars CB_API_BASE / CB_DEFAULT_PROFILE / CB_USER / CB_SCOPES to prefill.")

HEADERS = {"X-User": USER_ID}
if USER_SCOPES.strip():
    HEADERS["X-Scopes"] = USER_SCOPES

# =========================
# Helpers
# =========================
def api_get(path: str, params: Dict[str, Any] = None) -> Any:
    url = API_BASE.rstrip("/") + path
    r = requests.get(url, headers=HEADERS, params=params or {}, timeout=60)
    r.raise_for_status()
    return r.json()

def api_post(path: str, payload: Dict[str, Any]) -> Any:
    url = API_BASE.rstrip("/") + path
    r = requests.post(url, headers={**HEADERS, "Content-Type": "application/json"}, json=payload, timeout=120)
    r.raise_for_status()
    return r.json()

def pretty_sources(citations: List[dict]) -> str:
    if not citations:
        return "_No citations returned._"
    lines = []
    for c in citations:
        src = c.get("source", "unknown")
        q = c.get("query", "").strip()
        if q == "":
            q = c.get("file", "")
        if f"- **{src}** → `{q}`" not in lines:
            lines.append(f"- **{src}** → `{q}`")
    return "\n".join(lines)

# =========================
# Header
# =========================
st.title("🧠 ContextBridge — Demo UI")
st.caption("Ask questions, see answers, citations, and traces.")

# Tabs
tab_ask, tab_traces, tab_schema, tab_about = st.tabs(["💬 Ask", "📜 Traces", "🧩 Schema", "ℹ️ About"])

# =========================
# Tab: Ask
# =========================
with tab_ask:
    st.subheader("Ask the middleware")

    col1, col2 = st.columns([3, 1])
    with col1:
        query_text = st.text_area("Your question", value="Show unpaid invoices for ACME Corp", height=100)
    with col2:
        profile = st.text_input("Profile", value=DEFAULT_PROFILE)

    run = st.button("Run Query", type="primary")
    if run:
        if not query_text.strip():
            st.warning("Please enter a question.")
        else:
            try:
                t0 = time.time()
                res = api_post("/query", {"profile": [profile], "query": query_text})
                elapsed = time.time() - t0

                st.success(f"Done in {elapsed*1000:.0f} ms")
                st.subheader("Answer")
                st.markdown(res.get("answer", "").strip() or "_(empty)_")

                st.subheader("Citations")
                st.markdown(pretty_sources(res.get("citations", [])))

                st.info(f"Trace ID: `{res.get('trace_id','-')}`")

                with st.expander("Raw response"):
                    st.json(res)

            except requests.HTTPError as e:
                st.error(f"HTTP {e.response.status_code}: {e.response.text}")
            except Exception as e:
                st.exception(e)

# =========================
# Tab: Traces
# =========================
with tab_traces:
    st.subheader("Trace Explorer")

    c1, c2 = st.columns([2, 1])
    with c1:
        trace_id_input = st.text_input("Trace ID")
    with c2:
        fetch_btn = st.button("Fetch Trace")

    if fetch_btn and trace_id_input.strip():
        try:
            tr = api_get(f"/trace/{trace_id_input.strip()}")
            st.json(tr)
        except requests.HTTPError as e:
            st.error(f"HTTP {e.response.status_code}: {e.response.text}")
        except Exception as e:
            st.exception(e)

    st.markdown("---")
    st.subheader("Recent Traces")
    col_a, col_b, col_c = st.columns([1, 1, 1])
    with col_a:
        limit = st.number_input("Limit", min_value=1, max_value=200, value=25)
    with col_b:
        offset = st.number_input("Offset", min_value=0, value=0)
    with col_c:
        list_btn = st.button("List Traces")

    if list_btn:
        try:
            rows = api_get("/traces", params={"limit": int(limit), "offset": int(offset)})
            if not rows:
                st.info("No traces yet.")
            else:
                # Make a simple table
                import pandas as pd
                df = pd.DataFrame(rows)
                # Put most relevant columns first if present
                cols_order = [c for c in ["ts", "trace_id", "user", "query", "profile", "elapsed_ms", "model"] if c in df.columns]
                other_cols = [c for c in df.columns if c not in cols_order]
                df = df[cols_order + other_cols]
                st.dataframe(df, use_container_width=True)
        except requests.HTTPError as e:
            st.error(f"HTTP {e.response.status_code}: {e.response.text}")
        except Exception as e:
            st.exception(e)

# =========================
# Tab: Schema
# =========================
with tab_schema:
    st.subheader("Connectors & Schemas")
    st.caption("Pulled from `/schema` on the API.")

    if st.button("Refresh Schema"):
        st.experimental_rerun()

    try:
        sch = api_get("/schema")
        if not sch:
            st.info("No connectors or schema returned.")
        else:
            for name, meta in sch.items():
                with st.expander(f"🔌 {name}", expanded=False):
                    st.json(meta)
    except requests.HTTPError as e:
        st.error(f"HTTP {e.response.status_code}: {e.response.text}")
    except Exception as e:
        st.exception(e)

# =========================
# Tab: About
# =========================
with tab_about:
    st.subheader("About this UI")
    st.markdown(
        """
This UI is a thin client for the ContextBridge middleware:

- **/query** → Runs the full pipeline (LLM-generated SQL/REST → connectors → context → final LLM answer).
- **/trace** → Shows the full audit trail for a single answer.
- **/traces** → Lists recent traces for quick inspection.
- **/schema** → Introspects the configured connectors.

**Tips**
- Use the sidebar to set the API base URL and user headers.
- Profiles are YAML files used by the orchestrator (default: `sales_reply`).
- Add more profiles/connectors, restart the API, then refresh the UI.
        """
    )
