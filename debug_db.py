
from backend.models.database import get_db_connection
import json

def debug_tv_status():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    output = []

    output.append("--- TeleVerification Rows (VERIFIED/REJECTED) ---")
    cursor.execute("""
        SELECT tv.studentId, tv.volunteerId, tv.status as tv_status, s.status as student_status, s.name, tv.verificationDate
        FROM televerification tv
        JOIN student s ON tv.studentId = s.studentId
        WHERE tv.status IN ('VERIFIED', 'REJECTED')
    """)
    rows = cursor.fetchall()
    if not rows:
        output.append("No VERIFIED or REJECTED rows found.")
    for row in rows:
        output.append(str(row))

    output.append("\n--- All TeleVerification Rows ---")
    cursor.execute("""
        SELECT tv.studentId, tv.volunteerId, tv.status as tv_status, s.status as student_status, s.name
        FROM televerification tv
        JOIN student s ON tv.studentId = s.studentId
    """)
    rows = cursor.fetchall()
    for row in rows:
        output.append(f"ID: {row['studentId']}, TV Status: {row['tv_status']}, Student Status: {row['student_status']}")

    conn.close()

    with open("debug_output.txt", "w") as f:
        f.write("\n".join(output))

if __name__ == "__main__":
    debug_tv_status()
