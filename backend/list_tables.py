import sys
import os

# Add parent directory to path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.models.database import get_db_connection

def list_tables():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB")
        return

    cursor = conn.cursor(dictionary=True)
    
    print("--- Tables ---")
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    for t in tables:
        print(t)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    list_tables()
