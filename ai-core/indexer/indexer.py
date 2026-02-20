# indexer/indexer.py
import hashlib
from typing import List, Dict
from indexer.textifier import Textifier
from indexer.embeddings import EmbeddingModel
from indexer.storage_faiss import FaissStore


class ContextIndexer:
    """
    Handles indexing and retrieval for all connectors.
    Supports both active sources (SQL/REST) and passive sources (e.g. files).
    """

    def __init__(self, llm_builder, dim: int = 384):
        self.textifier = Textifier(llm_builder)
        self.embedder = EmbeddingModel()
        self.store = FaissStore(dim)
        self._seeded_sources = set()
        self._doc_seen = set()  # prevent duplicate embedding of same file chunks

    # ---------------- Utility ----------------
    def _hash_doc(self, text: str, meta: dict) -> str:
        h = hashlib.sha1()
        h.update(text.encode("utf-8", errors="ignore"))
        h.update(str(meta.get("file", "")).encode())
        h.update(str(meta.get("loc", "")).encode())
        h.update(str(meta.get("source", "")).encode())
        return h.hexdigest()

    # ---------------- Passive Corpus Seeding ----------------
    def seed_static_corpus(self, source: str, rows: list[dict], schema_text: str = ""):
        """
        Seed a static (passive) corpus like local files into the FAISS store once.
        """
        if source in self._seeded_sources or not rows:
            return

        texts, metas = [], []
        for r in rows:
            text = (r.get("text") or "").strip()
            if not text:
                continue
            meta = {
                "source": source,
                "type": "files",
                "file": r.get("file"),
                "loc": r.get("loc"),
            }
            dh = self._hash_doc(text, meta)
            if dh in self._doc_seen:
                continue
            self._doc_seen.add(dh)
            texts.append(text)
            metas.append(meta)

        if not texts:
            return

        emb = self.embedder.embed(texts)
        self.store.add(emb, texts, metas)
        self._seeded_sources.add(source)
        print(f"[ContextIndexer] Seeded {len(texts)} file docs from {source}")

    # ---------------- Active Source Indexing ----------------
    def index_results(
            self,
            user_query: str,
            results: Dict[str, List[Dict]],
            schemas: Dict[str, str],
            queries_by_source: Dict[str, str] | None = None,   # <-- NEW (optional)
        ):
            """
            Indexes results coming from active connectors (SQL, REST, etc.).
            Also adds one LLM-grounded interpretation doc per source (optional).
            """
            texts, metas = [], []

            for source, rows in results.items():
                schema_text = schemas.get(source, "")
                is_files = source.lower().startswith("files")

                if is_files:
                    for r in rows:
                        doc_text = r.get("text") or self.textifier.structured_to_lines([r], source)[0]
                        meta = {
                            "source": source,
                            "type": "files",
                            "file": r.get("file"),
                            "loc": r.get("loc"),
                            "score": r.get("score"),
                        }
                        texts.append(doc_text)
                        metas.append(meta)
                else:
                    # 1) Deterministic row lines (no LLM)
                    lines = self.textifier.structured_to_lines(rows, source)
                    for line in lines:
                        texts.append(line)
                        metas.append({"source": source, "type": "row"})

                    # 2) Optional: one LLM interpretation per source (grounded)
                    if rows:
                        exec_q = (queries_by_source or {}).get(source, "")
                        try:
                            summary = self.textifier.summarize_with_llm(
                                user_query=user_query,
                                schema_text=schema_text,
                                rows=rows[:30],       # cap to keep prompt small
                                source=source,
                                exec_query=exec_q     # <-- pass executed query
                            )
                            if summary and summary.strip():
                                texts.append(summary.strip())
                                metas.append({"source": source, "type": "summary", "query": exec_q})
                        except Exception as e:
                            # don't fail indexing if LLM summary has issues
                            print(f"[ContextIndexer] summarize_with_llm failed for {source}: {e}")

            if not texts:
                return

            emb = self.embedder.embed(texts)
            self.store.add(emb, texts, metas)
            print(f"[ContextIndexer] Indexed {len(texts)} docs from active connectors")


    # ---------------- Retrieval ----------------
    def retrieve_context(self, user_query: str, top_k: int = 10) -> List[str]:
        """Kept for backward compatibility."""
        items = self.retrieve_context_items(user_query, top_k)
        return [it["text"] for it in items]

    def retrieve_context_items(self, user_query: str, top_k: int = 10) -> List[Dict]:
        """
        Returns [{text, meta, score}] for top_k matches.
        Never raises; filters out invalid indices and length mismatches.
        """
        try:
            q_emb = self.embedder.embed(user_query)
        except Exception:
            return []

        try:
            hits = self.store.search(q_emb, top_k) or []
        except Exception:
            return []

        out: List[Dict] = []
        n_docs = len(getattr(self.store, "docs", []))
        n_meta = len(getattr(self.store, "metas", []))

        for h in hits:
            # Ensure (idx, score) tuple
            if not isinstance(h, (list, tuple)) or len(h) != 2:
                continue
            idx, score = h

            # Guard indices
            if not isinstance(idx, int):
                try:
                    idx = int(idx)
                except Exception:
                    continue
            if idx < 0 or idx >= n_docs:
                continue

            # Safe fetch meta
            meta = self.store.metas[idx] if idx < n_meta else {}
            try:
                out.append({
                    "text": self.store.docs[idx],
                    "meta": meta,
                    "score": float(score),
                })
            except Exception:
                # Skip malformed rows
                continue

        return out
