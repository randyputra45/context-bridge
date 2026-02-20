# data/init_db.py
import sqlite3
from datetime import date, timedelta
import os

DB_PATH = "data/sample.db"
os.makedirs("data", exist_ok=True)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.executescript("""
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS payments;

CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    industry TEXT,
    region TEXT,
    contact_email TEXT
);

CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client TEXT,
    date TEXT,
    amount REAL,
    status TEXT,
    due_date TEXT
);

CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client TEXT,
    amount REAL,
    payment_date TEXT,
    method TEXT
);
""")

clients = [
    ("ACME Corp", "Manufacturing", "Europe", "billing@acme.com"),
    ("BetaTech", "Software", "US", "finance@betatech.com"),
    ("NovaLtd", "Retail", "Asia", "sales@novaltd.com"),
    ("Helios", "Energy", "Europe", "contact@helios.eu")
]
cur.executemany("INSERT INTO clients(name,industry,region,contact_email) VALUES (?,?,?,?)", clients)

today = date.today()

invoices = [
    ("ACME Corp", str(today - timedelta(days=5)), 1200.0, "unpaid", str(today + timedelta(days=25))),
    ("ACME Corp", str(today - timedelta(days=40)), 2500.0, "paid", str(today - timedelta(days=10))),
    ("BetaTech", str(today - timedelta(days=10)), 3400.0, "unpaid", str(today + timedelta(days=20))),
    ("NovaLtd", str(today - timedelta(days=20)), 1500.0, "paid", str(today - timedelta(days=2))),
    ("Helios", str(today - timedelta(days=15)), 5000.0, "unpaid", str(today + timedelta(days=15)))
]
cur.executemany("INSERT INTO invoices(client,date,amount,status,due_date) VALUES (?,?,?,?,?)", invoices)

payments = [
    ("ACME Corp", 2500.0, str(today - timedelta(days=9)), "bank_transfer"),
    ("NovaLtd", 1500.0, str(today - timedelta(days=3)), "credit_card"),
]
cur.executemany("INSERT INTO payments(client,amount,payment_date,method) VALUES (?,?,?,?)", payments)

conn.commit()
conn.close()

print("✅ Sample database created successfully at", DB_PATH)
