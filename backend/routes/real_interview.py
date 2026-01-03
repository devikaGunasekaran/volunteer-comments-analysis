"""
Real Interview Routes for Real Interview Management
Handles superadmin operations: viewing VI-selected students and assigning RI volunteers
"""

from flask import Blueprint, session, jsonify, request, redirect, render_template, flash
from backend.models.database import fetchall_dict, fetchone_dict, execute_query
from datetime import datetime

real_interview_bp = Blueprint('real_interview', __name__, url_prefix='/real-interview')


# ============================================
# Authorization Middleware
# ============================================
@real_interview_bp.before_request
def check_superadmin():
    """Ensure only superadmin can access these routes"""
    # Allow OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        return None
    
    if 'role' not in session or session.get('role') != 'superadmin':
        if request.path.startswith('/real-interview/api/'):
            return jsonify({'error': 'Unauthorized access'}), 401
        flash("Unauthorized access! Superadmin privileges required.", "danger")
        return redirect('/login')


# ============================================
# API Endpoints
# ============================================

@real_interview_bp.route('/api/eligible-students', methods=['GET'])
def get_eligible_students():
    """
    Get students who were selected by VI volunteers and are eligible for Real Interview
    Returns students where VirtualInterview status = 'RECOMMENDED' or 'SELECT'
    """
    try:
        query = """
            SELECT 
                s.studentId,
                s.name,
                s.district,
                s.phone,
                s.email,
                vi.interviewDate as vi_date,
                vi.overallRecommendation as vi_recommendation,
                vi.comments as vi_comments,
                v.name as vi_volunteer_name,
                v.email as vi_volunteer_email,
                ri.volunteerId as assigned_ri_volunteer_id,
                rv.name as assigned_ri_volunteer_name,
                rv.email as assigned_ri_volunteer_email,
                ri.assignedDate as ri_assigned_date,
                ri.status as ri_status
            FROM Student s
            INNER JOIN VirtualInterview vi ON s.studentId = vi.studentId
            LEFT JOIN RealInterview ri ON s.studentId = ri.studentId
            LEFT JOIN Volunteer v ON vi.volunteerId = v.volunteerId
            LEFT JOIN Volunteer rv ON ri.volunteerId = rv.volunteerId
            WHERE vi.status IN ('RECOMMENDED', 'SELECT')
              AND s.status = 'APPROVED'
<<<<<<< HEAD
=======
              AND (ri.status IS NULL OR ri.status != 'COMPLETED')
>>>>>>> Tarun
            ORDER BY 
                CASE WHEN ri.volunteerId IS NULL THEN 0 ELSE 1 END,
                vi.interviewDate DESC
        """
        students = fetchall_dict(query)
        return jsonify({'success': True, 'students': students})
    except Exception as e:
        print(f"Error fetching eligible students: {e}")
        return jsonify({'error': str(e)}), 500


@real_interview_bp.route('/api/ri-volunteers', methods=['GET'])
def get_ri_volunteers():
    """Get all Real Interview volunteers"""
    try:
        query = """
            SELECT volunteerId, name, email
            FROM Volunteer
            WHERE role = 'ri'
            ORDER BY volunteerId
        """
        volunteers = fetchall_dict(query)
        return jsonify({'success': True, 'volunteers': volunteers})
    except Exception as e:
        print(f"Error fetching RI volunteers: {e}")
        return jsonify({'error': str(e)}), 500


@real_interview_bp.route('/api/assign-volunteer', methods=['POST'])
def assign_ri_volunteer():
    """Assign a Real Interview volunteer to a VI-selected student"""
    try:
        data = request.get_json()
        student_id = data.get('studentId')
        volunteer_id = data.get('volunteerId')
        
        if not student_id or not volunteer_id:
            return jsonify({'error': 'studentId and volunteerId are required'}), 400
        
        # Check if already assigned
        existing = fetchone_dict(
            "SELECT riId FROM RealInterview WHERE studentId = %s",
            (student_id,)
        )
        
        if existing:
            # Update existing assignment
            execute_query("""
                UPDATE RealInterview
                SET volunteerId = %s, 
                    assignedDate = %s, 
                    status = 'PENDING',
                    updatedAt = NOW()
                WHERE studentId = %s
            """, (volunteer_id, datetime.now(), student_id))
            message = 'RI volunteer reassigned successfully'
        else:
            # Create new assignment
            execute_query("""
                INSERT INTO RealInterview (studentId, volunteerId, assignedDate, status)
                VALUES (%s, %s, %s, 'PENDING')
            """, (student_id, volunteer_id, datetime.now()))
            message = 'RI volunteer assigned successfully'
        
        return jsonify({'success': True, 'message': message})
        
    except Exception as e:
        print(f"Error assigning RI volunteer: {e}")
        return jsonify({'error': str(e)}), 500


@real_interview_bp.route('/api/completed', methods=['GET'])
def get_completed_ri():
    """Get all completed Real Interviews"""
    try:
        query = """
            SELECT 
                ri.riId,
                ri.studentId,
                s.name as student_name,
                s.district,
                s.phone,
                ri.volunteerId,
                v.name as volunteer_name,
                v.email as volunteer_email,
                ri.assignedDate,
                ri.interviewDate,
                ri.status,
                ri.technicalScore,
                ri.communicationScore,
                ri.overallRecommendation,
                ri.remarks
            FROM RealInterview ri
            INNER JOIN Student s ON ri.studentId = s.studentId
            LEFT JOIN Volunteer v ON ri.volunteerId = v.volunteerId
            WHERE ri.status IN ('COMPLETED', 'RECOMMENDED', 'NOT_RECOMMENDED')
            ORDER BY ri.interviewDate DESC
        """
        interviews = fetchall_dict(query)
        return jsonify({'success': True, 'interviews': interviews})
    except Exception as e:
        print(f"Error fetching completed RIs: {e}")
        return jsonify({'error': str(e)}), 500


@real_interview_bp.route('/api/stats', methods=['GET'])
def get_ri_stats():
    """Get Real Interview statistics for dashboard"""
    try:
        # Count VI-selected students eligible for RI
        eligible_query = """
            SELECT COUNT(*) as count
            FROM Student s
            INNER JOIN VirtualInterview vi ON s.studentId = vi.studentId
            WHERE vi.status IN ('RECOMMENDED', 'SELECT')
              AND s.status = 'APPROVED'
        """
        eligible = fetchone_dict(eligible_query)
        
        # Count assigned RI
        assigned_query = """
            SELECT COUNT(*) as count
            FROM RealInterview
            WHERE volunteerId IS NOT NULL AND status = 'PENDING'
        """
        assigned = fetchone_dict(assigned_query)
        
        # Count completed RI
        completed_query = """
            SELECT COUNT(*) as count
            FROM RealInterview
            WHERE status IN ('COMPLETED', 'RECOMMENDED', 'NOT_RECOMMENDED')
        """
        completed = fetchone_dict(completed_query)
        
        return jsonify({
            'success': True,
            'stats': {
                'eligible': eligible['count'] if eligible else 0,
                'assigned': assigned['count'] if assigned else 0,
                'completed': completed['count'] if completed else 0
            }
        })
    except Exception as e:
        print(f"Error fetching RI stats: {e}")
        return jsonify({'error': str(e)}), 500
