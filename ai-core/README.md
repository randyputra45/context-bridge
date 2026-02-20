# 🧠 ContextBridge Middleware

Modular AI middleware to connect LLMs with enterprise data sources (SQL, REST, etc.)
Built for rapid prototyping and hackathon-ready demos.

## Layers
1. Connectors (SQL, REST)
2. LLM Query Builder
3. Context Orchestrator
4. LLM Interface
5. Governance (Security & Logging)
6. API & SDK
7. UI / Streamlit Frontend

## Quick Start
```bash
bash create_structure.sh   # create project
python data/init_db.py     # init test DB
uvicorn mock_api.rest_server:app --reload  # start mock REST API
python main.py             # run a full test
