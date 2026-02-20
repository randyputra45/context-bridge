# indexer/storage_faiss.py
import faiss
import numpy as np

class FaissStore:
    def __init__(self, dim: int, path: str = "data/context.index"):
        self.path = path
        self.index = faiss.IndexFlatIP(dim)
        self.docs = []    # List[str]
        self.metas = []   # List[dict]

    def add(self, embeddings: np.ndarray, texts: list[str], metas: list[dict]):
        if len(texts) == 0:
            return
        assert len(texts) == len(metas) == embeddings.shape[0]
        self.index.add(embeddings)
        self.docs.extend(texts)
        self.metas.extend(metas)

    def search(self, query_emb: np.ndarray, top_k: int = 5):
        D, I = self.index.search(query_emb, top_k)
        # Return (idx, score) so caller can read docs[idx], metas[idx]
        return [(int(i), float(D[0][j])) for j, i in enumerate(I[0]) if i < len(self.docs)]

    def save(self):
        faiss.write_index(self.index, self.path)

    def load(self):
        self.index = faiss.read_index(self.path)
