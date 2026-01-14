from backend.models.database import get_db_connection

def run_migration():
    print("Running migration for FinalImages table...")
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return

    cursor = conn.cursor()
    
    try:
        # Create FinalImages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS FinalImages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                studentId INT NOT NULL,
                imageKey VARCHAR(255) NOT NULL,
                uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (studentId) REFERENCES Student(studentId) ON DELETE CASCADE
            );
        """)
        conn.commit()
        print("✅ FinalImages table created successfully")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
