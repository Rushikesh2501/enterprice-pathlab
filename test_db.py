import pyodbc
from app.core.config import settings
import urllib.parse

print(f"Connecting to {settings.SQL_HOST} with user {settings.SQL_USER}")

conn_str = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    f"SERVER={settings.SQL_HOST},{settings.SQL_PORT};"
    f"DATABASE={settings.SQL_DB};"
    f"UID={settings.SQL_USER};"
    f"PWD={settings.SQL_PASSWORD};"
    "TrustServerCertificate=yes;"
)

try:
    conn = pyodbc.connect(conn_str, timeout=5)
    print("Connection successful!")
    conn.close()
except Exception as e:
    print("Connection failed:", e)
