from backend.models.database import get_db_connection

def update_role():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE volunteer SET role = 'tv_admin' WHERE volunteerId = 'tv_admin'")
    conn.commit()
    cursor.close()
    conn.close()
    print('Role updated successfully')

if __name__ == "__main__":
    update_role()
