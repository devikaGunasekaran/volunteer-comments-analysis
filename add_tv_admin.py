from backend.models.database import get_db_connection
from mysql.connector import Error

def add_tv_admin():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return

    try:
        cursor = conn.cursor()
        
        # Check if tv_admin already exists
        cursor.execute("SELECT volunteerId FROM volunteer WHERE volunteerId = 'tv_admin'")
        if cursor.fetchone():
            print("Volunteer 'tv_admin' already exists.")
        else:
            # Add tv_admin volunteer
            query = """
                INSERT INTO volunteer (volunteerId, name, passed_out, college, phone, email, password, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = ('tv_admin', 'TV Admin', '2025', 'System', '0000000000', 'tv_admin@example.com', 'admin@123', 'tv')
            cursor.execute(query, values)
            conn.commit()
            print("Volunteer 'tv_admin' added successfully.")
            
        cursor.close()
        conn.close()
    except Error as e:
        print(f"Error adding tv_admin: {e}")

if __name__ == "__main__":
    add_tv_admin()
