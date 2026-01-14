from backend.models.database import get_db_connection

def fix_final_images_schema():
    print("🔧 Fixing FinalImages table schema...")
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return

    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("SHOW COLUMNS FROM FinalImages LIKE 'imageKey'")
        if cursor.fetchone():
            print("✅ 'imageKey' column already exists.")
        else:
            print("⚠️ 'imageKey' column missing. Adding it now...")
            cursor.execute("ALTER TABLE FinalImages ADD COLUMN imageKey VARCHAR(255) AFTER studentId")
            print("✅ Added 'imageKey' column.")

        # Check if uploadDate column exists
        cursor.execute("SHOW COLUMNS FROM FinalImages LIKE 'uploadDate'")
        if cursor.fetchone():
            print("✅ 'uploadDate' column already exists.")
        else:
            print("⚠️ 'uploadDate' column missing. Adding it now...")
            cursor.execute("ALTER TABLE FinalImages ADD COLUMN uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP")
            print("✅ Added 'uploadDate' column.")
            
        conn.commit()
        print("🎉 Schema update complete!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_final_images_schema()
