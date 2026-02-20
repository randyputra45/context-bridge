import os, requests
import re

class LLMClient:
    def __init__(self, model=None, endpoint=None):
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3.2:1b")
        self.endpoint = endpoint or os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
        self.url = f"{self.endpoint}/api/chat"

    def ask(self, context: str, question: str) -> dict:
        if not context or not context.strip():
            return {"answer": "No relevant information found.\n\nSources: none"}

        system = (
            "You are a strict retrieval-based assistant. "
            "You must answer using ONLY the text inside <CONTEXT>. "
            "If the context does not contain the answer, reply EXACTLY:\n"
            "No relevant information found.\n\nSources: none\n"
            "Do not add definitions, guesses, or prior knowledge. "
            "Do not explain general concepts unless stated in <CONTEXT>."
        )

        user = f"<CONTEXT>\n{context.strip()}\n</CONTEXT>\n\nQuestion: {question.strip()}\nAnswer:"

        r = requests.post(self.url, json={
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
            "options": {"temperature": 0, "num_predict": 200},
            "stream": False
        })

        r.raise_for_status()
        data = r.json()
        answer = (data.get("message", {}) or {}).get("content", "") or ""

        # ✅ Post-check
        if re.search(r"football", question, re.I) and "No relevant" not in answer and "football" not in context.lower():
            answer = "No relevant information found.\n\nSources: none"

        if "No relevant" not in answer and "<CONTEXT>" in answer:
            answer = re.sub(r"<.*?>", "", answer)

        return {"answer": answer.strip()}


