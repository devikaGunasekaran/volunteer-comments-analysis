
from backend.models.database import get_db_connection

def get_volunteer_creds():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT volunteerId, password FROM Volunteer WHERE volunteerId = 'V002'")
    row = cursor.fetchone()
    print(row)
    conn.close()

if __name__ == "__main__":
    get_volunteer_creds()
