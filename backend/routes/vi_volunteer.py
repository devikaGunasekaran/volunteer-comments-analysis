"""
VI Volunteer Routes for Virtual Interview Management
Handles VI volunteer operations: viewing assigned students and submitting interview results
"""

from flask import Blueprint, session, jsonify, request, redirect, render_template, flash
from backend.models.database import fetchall_dict, fetchone_dict, execute_query
from datetime import datetime
import json

vi_volunteer_bp = Blueprint('vi_volunteer', __name__, url_prefix='/vi')


# ============================================
# Authorization Middleware
# ============================================
@vi_volunteer_bp.before_request
def check_vi_volunteer():
    """Ensure only VI volunteers can access these routes"""
    # Allow OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        return None
    
    if 'role' not in session or session.get('role') != 'vi':
        if request.path.startswith('/vi/api/'):
            return jsonify({'error': 'Unauthorized access'}), 401
        flash("Unauthorized access! VI volunteer privileges required.", "danger")
        return redirect('/login')


# ============================================
# Dashboard Routes
# ============================================
@vi_volunteer_bp.route('/dashboard')
def vi_dashboard():
    """VI volunteer main dashboard"""
    return render_template('vi_dashboard.html')


# ============================================
# API Endpoints
# ============================================

@vi_volunteer_bp.route('/api/assigned-students', methods=['GET'])
def get_assigned_students():
    """
    Get students assigned to the logged-in VI volunteer
    Returns students from VirtualInterview table where volunteerId matches session
    """
    try:
        volunteer_id = session.get('volunteerId')
        
        query = """
            SELECT 
                vi.viId,
                vi.studentId,
                s.name,
                s.district,
                s.phone,
                vi.assignedDate,
                vi.interviewDate,
                vi.status,
                vi.overallRecommendation,
                vi.comments
            FROM VirtualInterview vi
            JOIN Student s ON vi.studentId = s.studentId
            WHERE vi.volunteerId = %s
            ORDER BY 
                CASE 
                    WHEN vi.status = 'PENDING' THEN 0
                    WHEN vi.status = 'COMPLETED' THEN 1
                    ELSE 2
                END,
                vi.assignedDate DESC
        """
        students = fetchall_dict(query, (volunteer_id,))
        return jsonify({'success': True, 'students': students})
    except Exception as e:
        print(f"Error fetching assigned students: {e}")
        return jsonify({'error': str(e)}), 500


@vi_volunteer_bp.route('/api/student/<student_id>', methods=['GET'])
def get_student_details(student_id):
    """
    Get complete student details for VI interview
    Similar to admin view but for VI volunteer
    """
    try:
        volunteer_id = session.get('volunteerId')
        
        # Verify this student is assigned to this VI volunteer
        assignment_check = fetchone_dict(
            "SELECT viId FROM VirtualInterview WHERE studentId = %s AND volunteerId = %s",
            (student_id, volunteer_id)
        )
        
        if not assignment_check:
            return jsonify({'error': 'Student not assigned to you'}), 403
        
        # Get student basic info
        student = fetchone_dict(
            "SELECT * FROM Student WHERE studentId = %s",
            (student_id,)
        )
        
        # Get PV report
        pv = fetchone_dict(
            "SELECT * FROM PhysicalVerification WHERE studentId = %s",
            (student_id,)
        )
        
        # Get TV report
        tv = fetchone_dict(
            "SELECT * FROM TeleVerification WHERE studentId = %s",
            (student_id,)
        )
        
        # Get marks
        marks10 = fetchone_dict(
            "SELECT * FROM marks_10th WHERE studentId = %s",
            (student_id,)
        )
        
        marks12 = fetchone_dict(
            "SELECT * FROM marks_12th WHERE studentId = %s",
            (student_id,)
        )
        
        # Get images & analysis (matching admin.py)
        images_raw = fetchall_dict("""
            SELECT 
                fi.imageUrl, 
                ia.conditionResult, 
                ia.issuesFound,
                ia.qualityStatus
            FROM FinalImages fi
            LEFT JOIN ImageAnalysis ia ON fi.analysisId = ia.analysisId
            WHERE fi.studentId = %s
        """, (student_id,))
        
        # Get collective analysis (matching admin.py)
        analysis_raw = fetchone_dict("""
            SELECT issuesFound 
            FROM ImageAnalysis 
            WHERE analysisId = (
                SELECT analysisId FROM FinalImages 
                WHERE studentId = %s AND analysisId IS NOT NULL 
                LIMIT 1
            )
            OR studentId = %s
            ORDER BY analysisId DESC LIMIT 1
        """, (student_id, student_id))
        
        collective_analysis = []
        if analysis_raw and analysis_raw.get('issuesFound'):
            try:
                if isinstance(analysis_raw['issuesFound'], str):
                    collective_analysis = json.loads(analysis_raw['issuesFound'])
                else:
                    collective_analysis = analysis_raw['issuesFound']
            except:
                collective_analysis = []
        
        # Process images with presigned URLs
        from backend.services.s3_service import generate_presigned_url
        images_data = []
        for row in images_raw:
            if row['imageUrl']:
                key = row['imageUrl'].split('.com/')[-1]
                url = generate_presigned_url(key, 3600)
                
                issues = []
                if row['issuesFound']:
                    try:
                        if isinstance(row['issuesFound'], str):
                            issues = json.loads(row['issuesFound'])
                        else:
                            issues = row['issuesFound']
                    except:
                        issues = []
                
                images_data.append({
                    'url': url,
                    'condition': row['conditionResult'],
                    'issues': issues,
                    'quality': row['qualityStatus']
                })
        
        # Get audio URL
        audio_url = pv.get('audio_url') if pv else None
        
        return jsonify({
            'success': True,
            'student': student,
            'pv': pv,
            'tv': tv,
            'marks10': marks10,
            'marks12': marks12,
            'images': images_data,
            'collective_analysis': collective_analysis,
            'audio_url': audio_url
        })
        
    except Exception as e:
        print(f"Error fetching student details: {e}")
        return jsonify({'error': str(e)}), 500


@vi_volunteer_bp.route('/api/submit-interview/<student_id>', methods=['POST'])
def submit_interview(student_id):
    """
    Submit VI interview results
    Accepts: recommendation (SELECT/REJECT/ON HOLD), remarks
    """
    try:
        volunteer_id = session.get('volunteerId')
        data = request.get_json()
        
        recommendation = data.get('recommendation')  # SELECT, REJECT, ON HOLD
        remarks = data.get('remarks', '')
        
        if not recommendation:
            return jsonify({'error': 'Recommendation is required'}), 400
        
        if not remarks or len(remarks.strip()) < 50:
            return jsonify({'error': 'Remarks must be at least 50 characters'}), 400
        
        # Verify this student is assigned to this VI volunteer
        assignment = fetchone_dict(
            "SELECT viId FROM VirtualInterview WHERE studentId = %s AND volunteerId = %s",
            (student_id, volunteer_id)
        )
        
        if not assignment:
            return jsonify({'error': 'Student not assigned to you'}), 403
        
        # Determine status based on recommendation
        if recommendation == 'SELECT':
            status = 'RECOMMENDED'
            overall_rec = 'YES'
        elif recommendation == 'REJECT':
            status = 'NOT_RECOMMENDED'
            overall_rec = 'NO'
        else:  # ON HOLD
            status = 'ON_HOLD'
            overall_rec = 'MAYBE'
        
        # Update VirtualInterview record
        execute_query("""
            UPDATE VirtualInterview
            SET interviewDate = %s,
                status = %s,
                overallRecommendation = %s,
                comments = %s,
                updatedAt = NOW()
            WHERE studentId = %s AND volunteerId = %s
        """, (datetime.now(), status, overall_rec, remarks, student_id, volunteer_id))
        
        return jsonify({
            'success': True,
            'message': 'Interview submitted successfully'
        })
        
    except Exception as e:
        print(f"Error submitting interview: {e}")
        return jsonify({'error': str(e)}), 500


@vi_volunteer_bp.route('/api/completed-interviews', methods=['GET'])
def get_completed_interviews():
    """Get VI volunteer's completed interviews"""
    try:
        volunteer_id = session.get('volunteerId')
        
        query = """
            SELECT 
                vi.viId,
                vi.studentId,
                s.name as student_name,
                s.district,
                vi.interviewDate,
                vi.status,
                vi.overallRecommendation,
                vi.comments
            FROM VirtualInterview vi
            JOIN Student s ON vi.studentId = s.studentId
            WHERE vi.volunteerId = %s
              AND vi.status IN ('RECOMMENDED', 'NOT_RECOMMENDED', 'ON_HOLD')
            ORDER BY vi.interviewDate DESC
        """
        interviews = fetchall_dict(query, (volunteer_id,))
        return jsonify({'success': True, 'interviews': interviews})
    except Exception as e:
        print(f"Error fetching completed interviews: {e}")
        return jsonify({'error': str(e)}), 500
