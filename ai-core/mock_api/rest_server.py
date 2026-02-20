# mock_api/rest_server.py
# python -m uvicorn mock_api.rest_server:app --reload --port 8000

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="Mock CRM API")

customers = [
    {"id": 1, "name": "ACME Corp", "region": "Europe", "industry": "Manufacturing"},
    {"id": 2, "name": "BetaTech", "region": "US", "industry": "Software"},
    {"id": 3, "name": "NovaLtd", "region": "Asia", "industry": "Retail"},
    {"id": 4, "name": "Helios", "region": "Europe", "industry": "Energy"},
]

tickets = [
    {"id": 101, "client": "ACME Corp", "status": "open", "subject": "Payment delay"},
    {"id": 102, "client": "BetaTech", "status": "closed", "subject": "Account migration"},
    {"id": 103, "client": "Helios", "status": "open", "subject": "Invoice discrepancy"},
]

orders = [
    {"id": 201, "client": "ACME Corp", "date": "2025-10-01", "items": 5, "total": 1800},
    {"id": 202, "client": "BetaTech", "date": "2025-09-20", "items": 2, "total": 950},
]

@app.get("/customers")
def get_customers(name: str = None, region: str = None):
    results = customers
    if name:
        results = [c for c in results if name.lower() in c["name"].lower()]
    if region:
        results = [c for c in results if c["region"].lower() == region.lower()]
    return JSONResponse(results)

@app.get("/tickets")
def get_tickets(client: str = None, status: str = None):
    results = tickets
    if client:
        results = [t for t in results if client.lower() in t["client"].lower()]
    if status:
        results = [t for t in results if status.lower() == t["status"].lower()]
    return JSONResponse(results)

@app.get("/orders")
def get_orders(client: str = None, date: str = None):
    results = orders
    if client:
        results = [o for o in results if client.lower() in o["client"].lower()]
    if date:
        results = [o for o in results if o["date"] == date]
    return JSONResponse(results)
