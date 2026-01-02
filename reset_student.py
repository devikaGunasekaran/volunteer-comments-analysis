
from backend.models.database import get_db_connection

def reset_student(student_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print(f"Resetting Student {student_id} to TV status...")
    
    # Reset Student table
    cursor.execute("UPDATE student SET status='TV' WHERE studentId=%s", (student_id,))
    
    # Reset Televerification table
    cursor.execute("""
        UPDATE televerification 
        SET status='ASSIGNED', comments=NULL 
        WHERE studentId=%s
    """, (student_id,))
    
    conn.commit()
    print("Reset Complete. You can now submit verifying for this student again.")
    conn.close()

if __name__ == "__main__":
    reset_student('2025-014')
