"""
Scholarship Routes
Handles scholarship management for approved students
"""
from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from backend.models.database import get_db_connection

scholarship_bp = Blueprint('scholarship', __name__, url_prefix='/admin/scholarship')


@scholarship_bp.route("/<student_id>", methods=["GET"])
def scholarship_form(student_id):
    """Show scholarship details form for a student"""
    if 'role' not in session or session.get('role') != 'admin':
        return redirect(url_for('auth.login'))
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get student info
        cursor.execute("SELECT * FROM Student WHERE studentId=%s", (student_id,))
        student = cursor.fetchone()
        
        if not student or student['status'] != 'APPROVED':
            flash("Student not found or not approved!", "danger")
            return redirect(url_for('admin.approved_students'))
        
        # Get existing scholarship details if any
        cursor.execute("SELECT * FROM ScholarshipDetails WHERE studentId=%s", (student_id,))
        scholarship = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return render_template("scholarship_form.html", student=student, scholarship=scholarship)
        
    except Exception as e:
        print(f"Error loading scholarship form: {e}")
        flash("Error loading form!", "danger")
        return redirect(url_for('admin.approved_students'))


@scholarship_bp.route("/<student_id>", methods=["POST"])
def save_scholarship(student_id):
    """Save scholarship details for a student"""
    if 'role' not in session or session.get('role') != 'admin':
        return redirect(url_for('auth.login'))
    
    try:
        # Get form data
        batch = request.form.get('batch')
        stream = request.form.get('stream')
        college = request.form.get('college')
        branch = request.form.get('branch', '')
        admission_date = request.form.get('admission_date')
        remarks = request.form.get('remarks', '')
        
        # Validation
        if not all([batch, stream, college]):
            flash("Please fill all required fields!", "danger")
            return redirect(url_for('scholarship.scholarship_form', student_id=student_id))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert or update scholarship details
        cursor.execute("""
            INSERT INTO ScholarshipDetails 
                (studentId, batch, college, branch, stream, admissionDate, remarks)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                batch = VALUES(batch),
                college = VALUES(college),
                branch = VALUES(branch),
                stream = VALUES(stream),
                admissionDate = VALUES(admissionDate),
                remarks = VALUES(remarks),
                updatedAt = NOW()
        """, (student_id, batch, college, branch, stream, admission_date, remarks))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        flash("Scholarship details saved successfully!", "success")
        return redirect(url_for('admin.approved_students'))
        
    except Exception as e:
        print(f"Error saving scholarship details: {e}")
        flash("Error saving details!", "danger")
        return redirect(url_for('scholarship.scholarship_form', student_id=student_id))
