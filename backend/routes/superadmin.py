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


# ============================================
# Final Selection/Rejection Endpoints
# ============================================

@superadmin_bp.route('/api/students-for-final-decision', methods=['GET'])
def get_students_for_final_decision():
    """
    Get students who have been assigned RI volunteer and are ready for final decision
    Returns complete student journey: PV, VI, RI details
    """
    try:
        query = """
            SELECT 
                s.studentId,
                s.name,
                s.district,
                s.phone,
                s.email,
                s.status as student_status,
                s.finalDecision,
                s.finalRemarks,
                pv.verificationDate as pv_date,
                pv.sentiment as pv_recommendation,
                pv.comment as pv_comments,
                pv.elementsSummary as pv_elements,
                pv.sentiment_text as pv_sentiment_score,
                pv_vol.name as pv_volunteer_name,
                pv_vol.email as pv_volunteer_email,
                vi.interviewDate as vi_date,
                vi.status as vi_status,
                vi.overallRecommendation as vi_recommendation,
                vi.comments as vi_comments,
                vi.technicalScore as vi_technical_score,
                vi.communicationScore as vi_communication_score,
                vi_vol.name as vi_volunteer_name,
                vi_vol.email as vi_volunteer_email,
                ri.assignedDate as ri_assigned_date,
                ri.interviewDate as ri_date,
                ri.status as ri_status,
                ri.overallRecommendation as ri_recommendation,
                ri.remarks as ri_remarks,
                ri.technicalScore as ri_technical_score,
                ri.communicationScore as ri_communication_score,
                ri_vol.name as ri_volunteer_name,
                ri_vol.email as ri_volunteer_email,
                tv.volunteerId as tv_volunteer_id, tv_vol.name as tv_volunteer_name, 
                tv.verificationDate as tv_date, tv.status as tv_status, tv.comments as tv_comments
            FROM Student s
            INNER JOIN RealInterview ri ON s.studentId = ri.studentId
            LEFT JOIN Volunteer ri_vol ON ri.volunteerId = ri_vol.volunteerId
            LEFT JOIN VirtualInterview vi ON s.studentId = vi.studentId
            LEFT JOIN Volunteer vi_vol ON vi.volunteerId = vi_vol.volunteerId
            LEFT JOIN PhysicalVerification pv ON s.studentId = pv.studentId
            LEFT JOIN Volunteer pv_vol ON pv.volunteerId = pv_vol.volunteerId
            LEFT JOIN TeleVerification tv ON s.studentId = tv.studentId
            LEFT JOIN Volunteer tv_vol ON tv.volunteerId = tv_vol.volunteerId
            WHERE ri.volunteerId IS NOT NULL
              AND s.finalDecision IS NULL
            ORDER BY ri.assignedDate DESC
        """
        students = fetchall_dict(query)
        return jsonify({'success': True, 'students': students})
    except Exception as e:
        print(f"Error fetching students for final decision: {e}")
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/api/submit-final-decision', methods=['POST'])
def submit_final_decision():
    """
    Submit final scholarship decision (SELECTED/REJECTED) with remarks
    """
    try:
        data = request.get_json()
        student_id = data.get('studentId')
        decision = data.get('decision')  # 'SELECTED' or 'REJECTED'
        remarks = data.get('remarks')
        
        if not student_id or not decision or not remarks:
            return jsonify({'error': 'studentId, decision, and remarks are required'}), 400
        
        if decision not in ['SELECTED', 'REJECTED']:
            return jsonify({'error': 'decision must be SELECTED or REJECTED'}), 400
        
        superadmin_id = session.get('volunteerId', 'superadmin')
        
        # Update student with final decision
        execute_query("""
            UPDATE Student
            SET finalDecision = %s,
                finalRemarks = %s,
                finalDecisionDate = %s,
                finalDecisionBy = %s
            WHERE studentId = %s
        """, (decision, remarks, datetime.now(), superadmin_id, student_id))

        ri_details = data.get('riDetails', {})
        ri_technical_score = ri_details.get('technicalScore')
        ri_communication_score = ri_details.get('communicationScore')
        ri_recommendation = ri_details.get('recommendation')
        ri_remarks = ri_details.get('riRemarks')

        # Also update RealInterview status to COMPLETED as per user workflow
        # "when student details filled into final scholarship... he should get into view completed real interview"
        execute_query("""
            UPDATE RealInterview
            SET status = 'COMPLETED',
                overallRecommendation = %s,
                remarks = %s,
                technicalScore = %s,
                communicationScore = %s,
                interviewDate = %s,
                updatedAt = NOW()
            WHERE studentId = %s
        """, (ri_recommendation or decision, ri_remarks or remarks, 
              ri_technical_score, ri_communication_score, 
              datetime.now(), student_id))
        
        return jsonify({
            'success': True,
            'message': f'Student {decision.lower()} for scholarship successfully'
        })
        
    except Exception as e:
        print(f"Error submitting final decision: {e}")
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/api/final-decisions', methods=['GET'])
def get_final_decisions():
    """
    Get all students with final decisions (SELECTED/REJECTED)
    """
    try:
        query = """
            SELECT 
                s.studentId,
                s.name,
                s.district,
                s.phone,
                s.email,
                s.finalDecision,
                s.finalRemarks,
                s.finalDecisionDate,
                s.finalDecisionBy,
                ri.overallRecommendation as ri_recommendation,
                ri.remarks as ri_remarks,
                vi.overallRecommendation as vi_recommendation
            FROM Student s
            LEFT JOIN RealInterview ri ON s.studentId = ri.studentId
            LEFT JOIN VirtualInterview vi ON s.studentId = vi.studentId
            WHERE s.finalDecision IS NOT NULL
            ORDER BY s.finalDecisionDate DESC
        """
        students = fetchall_dict(query)
        return jsonify({'success': True, 'students': students})
    except Exception as e:
        print(f"Error fetching final decisions: {e}")
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/api/final-selection-stats', methods=['GET'])
def get_final_selection_stats():
    """
    Get statistics for final selection dashboard
    """
    try:
        # Count students pending final decision
        pending_query = """
            SELECT COUNT(*) as count
            FROM Student s
            INNER JOIN RealInterview ri ON s.studentId = ri.studentId
            WHERE ri.volunteerId IS NOT NULL
              AND s.finalDecision IS NULL
        """
        pending = fetchone_dict(pending_query)
        
        # Count selected students
        selected_query = """
            SELECT COUNT(*) as count
            FROM Student
            WHERE finalDecision = 'SELECTED'
        """
        selected = fetchone_dict(selected_query)
        
        # Count rejected students
        rejected_query = """
            SELECT COUNT(*) as count
            FROM Student
            WHERE finalDecision = 'REJECTED'
        """
        rejected = fetchone_dict(rejected_query)
        
        return jsonify({
            'success': True,
            'stats': {
                'pending': pending['count'] if pending else 0,
                'selected': selected['count'] if selected else 0,
                'rejected': rejected['count'] if rejected else 0
            }
        })
    except Exception as e:
        print(f"Error fetching final selection stats: {e}")
        return jsonify({'error': str(e)}), 500
