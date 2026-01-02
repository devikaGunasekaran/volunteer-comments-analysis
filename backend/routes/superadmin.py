"""
Superadmin Routes for Virtual Interview Management
Handles assignment of VI volunteers to approved students
"""

from flask import Blueprint, session, jsonify, request, redirect, render_template, flash
from backend.models.database import fetchall_dict, fetchone_dict, execute_query
from datetime import datetime

superadmin_bp = Blueprint('superadmin', __name__, url_prefix='/superadmin')


# ============================================
# Authorization Middleware
# ============================================
@superadmin_bp.before_request
def check_superadmin():
    """Ensure only superadmin can access these routes"""
    # Allow OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        return None
    
    if 'role' not in session or session.get('role') != 'superadmin':
        if request.path.startswith('/superadmin/api/'):
            return jsonify({'error': 'Unauthorized access'}), 401
        flash("Unauthorized access! Superadmin privileges required.", "danger")
        return redirect('/login')


# ============================================
# Dashboard Routes
# ============================================
@superadmin_bp.route('/dashboard')
def superadmin_dashboard():
    """Superadmin main dashboard"""
    return render_template('superadmin_dashboard.html')


# ============================================
# API Endpoints
# ============================================

@superadmin_bp.route('/api/approved-students', methods=['GET'])
def get_approved_students():
    """
    Get students approved by admin (ready for VI assignment)
    Returns students with status='APPROVED' and their VI assignment status
    """
    try:
        query = """
            SELECT 
                s.studentId,
                s.name,
                s.district,
                s.phone,
                s.status as student_status,
                vi.viId,
                vi.volunteerId as assigned_volunteer_id,
                vi.status as vi_status,
                vi.assignedDate,
                v.email as volunteer_email,
                v.name as volunteer_name
            FROM Student s
            LEFT JOIN VirtualInterview vi ON s.studentId = vi.studentId
            LEFT JOIN Volunteer v ON vi.volunteerId = v.volunteerId
            WHERE s.status = 'APPROVED'
            ORDER BY 
                CASE 
                    WHEN vi.viId IS NULL THEN 0  -- Unassigned first
                    ELSE 1
                END,
                s.studentId
        """
        students = fetchall_dict(query)
        return jsonify({'success': True, 'students': students})
    except Exception as e:
        print(f"Error fetching approved students: {e}")
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/api/vi-volunteers', methods=['GET'])
def get_vi_volunteers():
    """Get list of volunteers with 'vi' role"""
    try:
        query = """
            SELECT volunteerId, name, email, phone, role
            FROM Volunteer
            WHERE role = 'vi'
            ORDER BY name
        """
        volunteers = fetchall_dict(query)
        return jsonify({'success': True, 'volunteers': volunteers})
    except Exception as e:
        print(f"Error fetching VI volunteers: {e}")
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/api/assign-vi-volunteer', methods=['POST'])
def assign_vi_volunteer():
    """
    Assign a VI volunteer to a student
    Accepts: studentId, volunteerId (or volunteerEmail)
    """
    try:
        data = request.get_json()
        student_id = data.get('studentId')
        volunteer_id = data.get('volunteerId')
        volunteer_email = data.get('volunteerEmail')

        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400

        # If email provided, lookup volunteerId
        if volunteer_email and not volunteer_id:
            volunteer = fetchone_dict(
                "SELECT volunteerId FROM Volunteer WHERE email = %s AND role = 'vi'",
                (volunteer_email,)
            )
            if not volunteer:
                return jsonify({'error': 'VI volunteer not found with that email'}), 404
            volunteer_id = volunteer['volunteerId']

        if not volunteer_id:
            return jsonify({'error': 'Volunteer ID or email is required'}), 400

        # Check if assignment already exists
        existing = fetchone_dict(
            "SELECT viId FROM VirtualInterview WHERE studentId = %s",
            (student_id,)
        )

        if existing:
            # Update existing assignment
            execute_query("""
                UPDATE VirtualInterview
                SET volunteerId = %s,
                    assignedDate = %s,
                    status = 'PENDING',
                    interviewDate = NULL,
                    updatedAt = NOW()
                WHERE studentId = %s
            """, (volunteer_id, datetime.now(), student_id))
            message = 'VI volunteer reassigned successfully'
        else:
            # Create new assignment
            execute_query("""
                INSERT INTO VirtualInterview 
                (studentId, volunteerId, assignedDate, status, createdAt)
                VALUES (%s, %s, %s, 'PENDING', NOW())
            """, (student_id, volunteer_id, datetime.now()))
            message = 'VI volunteer assigned successfully'

        return jsonify({'success': True, 'message': message})

    except Exception as e:
        print(f"Error assigning VI volunteer: {e}")
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/api/vi-assignments', methods=['GET'])
def get_vi_assignments():
    """Get all VI assignments with details"""
    try:
        query = """
            SELECT 
                vi.viId,
                vi.studentId,
                s.name as student_name,
                s.district,
                vi.volunteerId,
                v.name as volunteer_name,
                v.email as volunteer_email,
                vi.assignedDate,
                vi.interviewDate,
                vi.status,
                vi.overallRecommendation
            FROM VirtualInterview vi
            JOIN Student s ON vi.studentId = s.studentId
            LEFT JOIN Volunteer v ON vi.volunteerId = v.volunteerId
            ORDER BY vi.assignedDate DESC
        """
        assignments = fetchall_dict(query)
        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Error fetching VI assignments: {e}")
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/api/completed-vi', methods=['GET'])
def get_completed_vi():
    """Get completed virtual interviews"""
    try:
        query = """
            SELECT 
                vi.viId,
                vi.studentId,
                s.name as student_name,
                s.district,
                vi.volunteerId,
                v.name as volunteer_name,
                v.email as volunteer_email,
                vi.interviewDate,
                vi.status,
                vi.technicalScore,
                vi.communicationScore,
                vi.overallRecommendation,
                vi.comments
            FROM VirtualInterview vi
            JOIN Student s ON vi.studentId = s.studentId
            LEFT JOIN Volunteer v ON vi.volunteerId = v.volunteerId
            WHERE vi.status IN ('COMPLETED', 'RECOMMENDED', 'NOT_RECOMMENDED')
            ORDER BY vi.interviewDate DESC
        """
        completed = fetchall_dict(query)
        return jsonify({'success': True, 'interviews': completed})
    except Exception as e:
        print(f"Error fetching completed VIs: {e}")
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/api/vi-details/<student_id>', methods=['GET'])
def get_vi_details(student_id):
    """Get detailed VI information for a specific student"""
    try:
        query = """
            SELECT 
                vi.*,
                s.name as student_name,
                s.district,
                s.phone,
                v.name as volunteer_name,
                v.email as volunteer_email,
                v.phone as volunteer_phone
            FROM VirtualInterview vi
            JOIN Student s ON vi.studentId = s.studentId
            LEFT JOIN Volunteer v ON vi.volunteerId = v.volunteerId
            WHERE vi.studentId = %s
        """
        details = fetchone_dict(query, (student_id,))
        
        if not details:
            return jsonify({'error': 'VI record not found'}), 404
            
        return jsonify({'success': True, 'details': details})
    except Exception as e:
        print(f"Error fetching VI details: {e}")
        return jsonify({'error': str(e)}), 500
