from typing import List, Dict, Tuple
from builder.query_builder import LLMQueryBuilder  # reuse your Ollama-based builder

def _compact_rows(rows: List[Dict], max_rows: int = 30, max_val_len: int = 80) -> Tuple[str, List[str]]:
    """
    Make a compact CSV-like snippet the LLM can handle reliably.
    """
    if not rows:
        return "", []
    headers = list(rows[0].keys())
    lines = [",".join(headers)]
    for r in rows[:max_rows]:
        vals = []
        for h in headers:
            v = r.get(h, "")
            if v is None:
                v = ""
            s = str(v).replace("\n", " ").replace(",", ";")
            if len(s) > max_val_len:
                s = s[: max_val_len - 3] + "..."
            vals.append(s)
        lines.append(",".join(vals))
    return "\n".join(lines), headers


class Textifier:
    def __init__(self, llm_builder: LLMQueryBuilder):
        self.llm = llm_builder

    def structured_to_lines(self, rows: List[Dict], source: str) -> List[str]:
        """
        Deterministic, no-LLM textification of rows (great for exact retrieval + provenance).
        """
        docs = []
        for r in rows:
            parts = [f"{k}={v}" for k, v in r.items() if v not in (None, "")]
            docs.append(f"[{source}] " + " • ".join(parts))
        return docs

    def summarize_with_llm(
        self,
        user_query: str,
        schema_text: str,
        rows: List[Dict],
        source: str,
        exec_query: str = ""              # <-- NEW (optional)
    ) -> str:
        sample = "\n".join(str(r) for r in rows[:5])
        prompt = (
            f"You are a data interpreter. Given the following schema and query results, "
            f"produce a short factual paragraph describing the relevant information "
            f"for answering the user question.\n\n"
            f"User question: {user_query}\n\n"
            f"Executed query/request:\n{exec_query or '(not provided)'}\n\n"  # <-- include it
            f"Schema:\n{schema_text}\n\n"
            f"Results (sample):\n{sample}\n\n"
            f"Output only the factual summary, no explanations."
        )
        summary = self.llm._call_ollama("You write concise summaries.", prompt)
        return f"[{source}] {summary.strip()}"

