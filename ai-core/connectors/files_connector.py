# connectors/files_connector.py
import os
import re
import asyncio
from typing import List, Dict, Tuple, Optional
from connectors.base import BaseConnector
from indexer.embeddings import EmbeddingModel

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

try:
    import pandas as pd
except ImportError:
    pd = None
    

try:
    import docx
except ImportError:
    docx = None


def _ingest_docx(path: str, max_chunk_chars: int = 800) -> List[Tuple[str, str]]:
    if docx is None:
        return []
    out = []
    try:
        document = docx.Document(path)
        full_text = " ".join([p.text for p in document.paragraphs])
        full_text = _clean_text(full_text)
        for i in range(0, len(full_text), max_chunk_chars):
            chunk = full_text[i:i + max_chunk_chars]
            if chunk.strip():
                out.append((f"chars {i}-{i + len(chunk)}", chunk))
    except Exception:
        return []
    return out



def _clean_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def _walk_files(root: str, exts: Tuple[str, ...]) -> List[str]:
    out = []
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower().endswith(exts):
                out.append(os.path.join(dirpath, fn))
    return out


def _doc_line(file_path: str, loc: str, text: str) -> str:
    return f"[files] {os.path.basename(file_path)} • {loc} • {text}"


def _ingest_txt(path: str, max_chunk_chars: int = 800) -> List[Tuple[str, str]]:
    lines = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception:
        return lines
    content = _clean_text(content)
    for i in range(0, len(content), max_chunk_chars):
        chunk = content[i:i + max_chunk_chars]
        if chunk.strip():
            lines.append((f"chars {i}-{i + len(chunk)}", chunk))
    return lines


def _ingest_pdf(path: str, max_chunk_chars: int = 1000) -> List[Tuple[str, str]]:
    if PyPDF2 is None:
        return []
    out = []
    try:
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for i, page in enumerate(reader.pages):
                txt = _clean_text(page.extract_text() or "")
                if txt:
                    out.append((f"page {i + 1}", txt[:max_chunk_chars]))
    except Exception:
        return []
    return out


def _ingest_csv(path: str, max_rows: int = 500) -> List[Tuple[str, str]]:
    if pd is None:
        return []
    try:
        df = pd.read_csv(path)
    except Exception:
        return []
    lines = []
    cols = list(df.columns)
    for idx, row in df.head(max_rows).iterrows():
        pairs = []
        for c in cols[:8]:
            v = row.get(c)
            if pd.isna(v):
                continue
            v = str(v)
            if len(v) > 60:
                v = v[:57] + "..."
            pairs.append(f"{c}={v}")
        if pairs:
            lines.append((f"row {idx}", "; ".join(pairs)))
    return lines


class _InMemoryFileIndex:
    """Simple index storing docs + metas (used for list_all)."""
    def __init__(self):
        self.docs: List[str] = []
        self.metas: List[Dict] = []

    def add(self, docs: List[str], metas: List[Dict]):
        self.docs.extend(docs)
        self.metas.extend(metas)


class FilesConnector(BaseConnector):
    """
    Passive connector that loads and serves local TXT/PDF/CSV files.
    It is NOT queried by the LLM; all docs are pre-indexed once.
    """

    is_passive = True

    def __init__(self, name, config):
        super().__init__(name, config)
        self.root_dir = config["root_dir"]
        self.exts = tuple(config.get("extensions", [".txt", ".pdf", ".csv"]))
        self.top_k_default = int(config.get("top_k_default", 5))
        self._index: Optional[_InMemoryFileIndex] = None
        self._loaded = False

    def schema(self):
        return {"list_all": {"description": "returns all local documents"}}

    # -------------- Ingestion --------------
    def _ensure_loaded(self):
        if self._loaded:
            return
        idx = _InMemoryFileIndex()
        paths = _walk_files(self.root_dir, self.exts)

        for p in paths:
            lp = p.lower()
            try:
                if lp.endswith(".txt"):
                    chunks = _ingest_txt(p)
                elif lp.endswith(".pdf"):
                    chunks = _ingest_pdf(p)
                elif lp.endswith(".csv"):
                    chunks = _ingest_csv(p)
                elif lp.endswith(".docx"):
                    chunks = _ingest_docx(p)
                else:
                    chunks = []
            except Exception:
                chunks = []

            for loc, text in chunks:
                idx.add([_doc_line(p, loc, text)], [{"file": p, "loc": loc}])

        self._index = idx
        self._loaded = True
        print(f"[FilesConnector] Loaded {len(idx.docs)} chunks from {len(paths)} files under {self.root_dir}")

    # -------------- Passive Access --------------
    def list_all(self):
        """Return all documents (used by orchestrator to seed corpus)."""
        self._ensure_loaded()
        rows = []
        for i, text in enumerate(self._index.docs):
            meta = self._index.metas[i]
            rows.append({
                "file": meta.get("file"),
                "loc": meta.get("loc"),
                "text": text,
            })
        return rows

    async def list_all_async(self):
        return await asyncio.to_thread(self.list_all)

    # -------------- Abstract Method Override --------------
    def execute(self, query: str):
        """
        Dummy execute() to satisfy BaseConnector.
        This connector is passive — no queries are actually run.
        """
        raise NotImplementedError(
            "[FilesConnector] is passive; use list_all() instead of execute()."
        )

