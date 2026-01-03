"""
Educational Details Routes
Handles collection of educational information for selected students
"""

from flask import Blueprint, session, jsonify, request
from backend.models.database import fetchall_dict, fetchone_dict, execute_query
from datetime import datetime

educational_bp = Blueprint('educational', __name__, url_prefix='/educational')


# ============================================
# Authorization Middleware
# ============================================
@educational_bp.before_request
def check_superadmin():
    """Ensure only superadmin can access these routes"""
    if request.method == 'OPTIONS':
        return None
    
    if 'role' not in session or session.get('role') != 'superadmin':
        if request.path.startswith('/educational/api/'):
            return jsonify({'error': 'Unauthorized access'}), 401
        return jsonify({'error': 'Unauthorized'}), 401


# ============================================
# API Endpoints
# ============================================

@educational_bp.route('/api/save-details', methods=['POST'])
def save_educational_details():
    """
    Save or update educational details for a student
    """
    try:
        data = request.get_json()
        student_id = data.get('studentId')
        college_name = data.get('collegeName')
        degree = data.get('degree')
        stream = data.get('stream')
        branch = data.get('branch', '')
        year_of_passing = data.get('yearOfPassing')
        
        if not all([student_id, college_name, degree, stream, year_of_passing]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Check if details already exist
        existing = fetchone_dict(
            "SELECT id FROM EducationalDetails WHERE studentId = %s",
            (student_id,)
        )
        
        if existing:
            # Update existing record
            execute_query("""
                UPDATE EducationalDetails
                SET collegeName = %s,
                    degree = %s,
                    stream = %s,
                    branch = %s,
                    yearOfPassing = %s,
                    updatedAt = %s
                WHERE studentId = %s
            """, (college_name, degree, stream, branch, year_of_passing, datetime.now(), student_id))
            
            message = 'Educational details updated successfully'
        else:
            # Insert new record
            execute_query("""
                INSERT INTO EducationalDetails 
                (studentId, collegeName, degree, stream, branch, yearOfPassing)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (student_id, college_name, degree, stream, branch, year_of_passing))
            
            message = 'Educational details saved successfully'
        
        return jsonify({
            'success': True,
            'message': message
        })
        
    except Exception as e:
        print(f"Error saving educational details: {e}")
        return jsonify({'error': str(e)}), 500


@educational_bp.route('/api/get-details/<student_id>', methods=['GET'])
def get_educational_details(student_id):
    """
    Get educational details for a specific student
    """
    try:
        query = """
            SELECT 
                ed.*,
                s.name,
                s.district
            FROM EducationalDetails ed
            JOIN Student s ON ed.studentId = s.studentId
            WHERE ed.studentId = %s
        """
        details = fetchone_dict(query, (student_id,))
        
        if not details:
            return jsonify({'success': True, 'details': None})
        
        return jsonify({'success': True, 'details': details})
        
    except Exception as e:
        print(f"Error fetching educational details: {e}")
        return jsonify({'error': str(e)}), 500


@educational_bp.route('/api/all-students-with-details', methods=['GET'])
def get_all_students_with_details():
    """
    Get all students who have educational details
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
                s.finalDecisionDate,
                ed.collegeName,
                ed.degree,
                ed.stream,
                ed.branch,
                ed.yearOfPassing,
                ed.createdAt as details_added_date
            FROM Student s
            INNER JOIN EducationalDetails ed ON s.studentId = ed.studentId
            WHERE s.finalDecision = 'SELECTED'
            ORDER BY ed.createdAt DESC
        """
        students = fetchall_dict(query)
        return jsonify({'success': True, 'students': students})
        
    except Exception as e:
        print(f"Error fetching students with educational details: {e}")
        return jsonify({'error': str(e)}), 500


@educational_bp.route('/api/student-profile/<student_id>', methods=['GET'])
def get_student_profile(student_id):
    """
    Get complete student profile including TV, PV (with AI prediction), VI, RI, and Educational Details
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
                s.finalDecisionDate,
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
                ri_vol.name as ri_volunteer_name,
                ri_vol.email as ri_volunteer_email,
                tv.verificationDate as tv_date,
                tv.status as tv_status,
                tv.comments as tv_comments,
                tv_vol.name as tv_volunteer_name,
                ed.collegeName,
                ed.degree,
                ed.stream,
                ed.branch,
                ed.yearOfPassing
            FROM Student s
            LEFT JOIN PhysicalVerification pv ON s.studentId = pv.studentId
            LEFT JOIN Volunteer pv_vol ON pv.volunteerId = pv_vol.volunteerId
            LEFT JOIN VirtualInterview vi ON s.studentId = vi.studentId
            LEFT JOIN Volunteer vi_vol ON vi.volunteerId = vi_vol.volunteerId
            LEFT JOIN RealInterview ri ON s.studentId = ri.studentId
            LEFT JOIN Volunteer ri_vol ON ri.volunteerId = ri_vol.volunteerId
            LEFT JOIN TeleVerification tv ON s.studentId = tv.studentId
            LEFT JOIN Volunteer tv_vol ON tv.volunteerId = tv_vol.volunteerId
            LEFT JOIN EducationalDetails ed ON s.studentId = ed.studentId
            WHERE s.studentId = %s
        """
        profile = fetchone_dict(query, (student_id,))
        
        if not profile:
            return jsonify({'error': 'Student not found'}), 404
        
        return jsonify({'success': True, 'profile': profile})
        
    except Exception as e:
        print(f"Error fetching student profile: {e}")
        return jsonify({'error': str(e)}), 500
