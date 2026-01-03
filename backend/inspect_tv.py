import sys
import os

# Add parent directory to path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.models.database import get_db_connection

def inspect_tv():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB")
        return

    cursor = conn.cursor(dictionary=True)
    
    # Check Columns
    print("--- TeleVerification Columns ---")
    cursor.execute("DESCRIBE televerification")
    columns = cursor.fetchall()
    
    for col in columns:
        print(f"{col['Field']} - {col['Type']}")
    
    # Check sample data
    print("\n--- Sample Data ---")
    cursor.execute("SELECT * FROM televerification LIMIT 1")
    rows = cursor.fetchall()
    print(rows)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    inspect_tv()
