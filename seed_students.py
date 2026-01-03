from backend.models.database import get_db_connection
from mysql.connector import Error
import random

def seed_students():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return

    students = [
        ('2025-010', 'Suresh Kumar', 'Chennai', 'Govt Higher Secondary School', 'To pursue higher education', '9840012345', 'suresh@example.com', None, '50000', 'Kumar', 'Lakshmi', 'Male', '123 Main St, Chennai'),
        ('2025-011', 'Meena Kumari', 'Madurai', 'St. Marys School', 'Financial support for college', '9840067890', 'meena@example.com', None, '45000', 'Raja', 'Sarala', 'Female', '45 Cross St, Madurai'),
        ('2025-012', 'Venkatesh R', 'Coimbatore', 'City Public School', 'Ambition to be an engineer', '9840011223', 'venky@example.com', None, '60000', 'Ramesh', 'Sudha', 'Male', '78 North St, Coimbatore'),
        ('2025-013', 'Anitha S', 'Salem', 'Salem Girls School', 'Dream of becoming a doctor', '9840044556', 'anitha@example.com', None, '35000', 'Subramani', 'Parvathi', 'Female', '12 South St, Salem'),
        ('2025-014', 'Prabhu D', 'Trichy', 'Trichy Boys School', 'Needs scholarship for books', '9840077889', 'prabhu@example.com', None, '55000', 'Dhanush', 'Kala', 'Male', '90 West St, Trichy'),
        ('2025-015', 'Deepika M', 'Erode', 'Erode Central School', 'First-generation learner', '9840099001', 'deepika@example.com', None, '42000', 'Murugan', 'Valli', 'Female', '23 East St, Erode'),
        ('2025-016', 'Rahul G', 'Vellore', 'Vellore Academy', 'Excellence in sports and studies', '9840033445', 'rahul.g@example.com', None, '48000', 'Ganesan', 'Revathi', 'Male', '56 Hill St, Vellore'),
        ('2025-017', 'Sneha P', 'Tiruppur', 'Cotton City School', 'Hardship due to low income', '9840055667', 'sneha.p@example.com', None, '38000', 'Prakash', 'Shanthi', 'Female', '11 Mill St, Tiruppur'),
        ('2025-018', 'Vijay K', 'Thanjavur', 'Thanjavur Boys Town', 'Interest in agriculture studies', '9840088990', 'vijay.k@example.com', None, '52000', 'Krishnan', 'Gayathri', 'Male', '34 Farm St, Thanjavur'),
        ('2025-019', 'Sandhya L', 'Kanchipuram', 'Silk City School', 'Passion for teaching', '9840022334', 'sandhya.l@example.com', None, '40000', 'Loganathan', 'Uma', 'Female', '67 Temple St, Kanchipuram')
    ]

    try:
        cursor = conn.cursor()
        
        for student in students:
            # Check if student already exists
            cursor.execute("SELECT studentId FROM student WHERE studentId = %s", (student[0],))
            if cursor.fetchone():
                print(f"Student {student[0]} already exists.")
                continue
                
            query = """
                INSERT INTO student (studentId, name, district, school, why_matram, phone, email, status, income, father, mother, gender, address)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, student)
            
        conn.commit()
        print(f"Successfully seeded {len(students)} students.")
            
        cursor.close()
        conn.close()
    except Error as e:
        print(f"Error seeding students: {e}")

if __name__ == "__main__":
    seed_students()
