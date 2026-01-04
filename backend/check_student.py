import sys
import os

# Add parent directory to path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.models.database import get_db_connection

def check_student_columns():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB")
        return

    cursor = conn.cursor(dictionary=True)
    
    print("--- Student Columns ---")
    cursor.execute("DESCRIBE Student")
    columns = cursor.fetchall()
    
    for col in columns:
        print(f"{col['Field']} - {col['Type']}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_student_columns()
