"""
Admin Routes
Handles admin operations including student review, decisions, and approvals
"""
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from backend.models.database import get_db_connection, fetchone_dict, fetchall_dict
from backend.services.s3_service import get_s3_client, generate_presigned_url
from backend.services.rag_service import add_student_case
from backend.config import Config
import json
import datetime

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# Get S3 client
s3 = get_s3_client()
BUCKET = Config.AWS_BUCKET


# =====================================================
# ADMIN PAGES
# =====================================================

@admin_bp.route("/assign")
def admin_assign():
    """Admin dashboard - shows students pending review"""
    if 'role' not in session or session.get('role') != 'admin':
        flash("Unauthorized access!", "danger")
        return redirect(url_for('auth.login'))
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch students whose PV is done but final decision not given
        cursor.execute("""
            SELECT 
                s.studentId,
                s.name,
                s.district,
                s.status,
                pv.comment,
                pv.elementsSummary,
                pv.sentiment_text,
                pv.status AS pv_status
            FROM student s
            INNER JOIN PhysicalVerification pv 
                ON s.studentId = pv.studentId
            WHERE 
                pv.status IS NOT NULL
                AND pv.status != 'PROCESSING'
                AND (s.status IS NULL OR s.status = 'PENDING')
        """)

        students = cursor.fetchall()

        cursor.close()
        conn.close()

        return render_template("admin_assign.html", students=students)

    except Exception as e:
        print("Error loading admin_assign:", e)
        return "Error loading page"


@admin_bp.route("/decision/<student_id>")
def admin_decision(student_id):
    """Admin decision page - full student review"""
    if 'role' not in session or session.get('role') != 'admin':
        flash("Unauthorized access!", "danger")
        return redirect(url_for('auth.login'))
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True, buffered=True)

        # Fetch student row
        cursor.execute("SELECT * FROM student WHERE studentId = %s", (student_id,))
        student = cursor.fetchone()

        # Fetch physical verification row
        cursor.execute("SELECT * FROM PhysicalVerification WHERE studentId = %s ORDER BY verificationDate DESC LIMIT 1", (student_id,))
        pv = cursor.fetchone()
        
        # Fetch tele verification row
        cursor.execute("SELECT * FROM TeleVerification WHERE studentId = %s ORDER BY verificationDate DESC LIMIT 1", (student_id,))
        tv = cursor.fetchone()

        # Fetch audio S3 key and generate presigned URL
        audio_url = None
        try:
            cursor.execute("SELECT audio_s3_key FROM PhysicalVerification WHERE studentId = %s AND audio_s3_key IS NOT NULL LIMIT 1", (student_id,))
            audio_row = cursor.fetchone()
            
            if audio_row and audio_row['audio_s3_key']:
                audio_url = generate_presigned_url(audio_row['audio_s3_key'], 3600)
                print(f"✅ Generated audio presigned URL for {student_id}")
        except Exception as audio_err:
            print(f"⚠️ Error fetching audio URL: {audio_err}")
            audio_url = None

        # Fetch images & analysis
        cursor.execute("""
            SELECT 
                fi.imageUrl, 
                ia.conditionResult, 
                ia.issuesFound,
                ia.qualityStatus
            FROM FinalImages fi
            LEFT JOIN ImageAnalysis ia ON fi.analysisId = ia.analysisId
            WHERE fi.studentId = %s
        """, (student_id,))
        
        image_rows = cursor.fetchall()
        
        # Fetch collective analysis
        cursor.execute("""
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
        analysis_row = cursor.fetchone()
        
        collective_analysis = []
        if analysis_row and analysis_row['issuesFound']:
            try:
                if isinstance(analysis_row['issuesFound'], str):
                    collective_analysis = json.loads(analysis_row['issuesFound'])
                else:
                    collective_analysis = analysis_row['issuesFound']
            except Exception as e:
                print(f"Error parsing collective_analysis: {e}")
                collective_analysis = []
        
        images_data = []
        for row in image_rows:
            if row['imageUrl']:
                # Generate presigned URL for each image
                key = row['imageUrl'].split('.com/')[-1]
                url = generate_presigned_url(key, 3600)
                
                # Parse issues if it's a JSON string
                issues = []
                if row['issuesFound']:
                    try:
                        if isinstance(row['issuesFound'], str):
                            issues = json.loads(row['issuesFound'])
                        else:
                            issues = row['issuesFound']
                    except Exception as e:
                        print(f"Error parsing issues: {e}")
                        issues = []
                
                images_data.append({
                    'url': url,
                    'condition': row['conditionResult'],
                    'issues': issues,
                    'quality': row['qualityStatus']
                })

        cursor.close()
        conn.close()

        if not student:
            flash("Student not found", "danger")
            return redirect(url_for("admin.admin_assign"))

        return render_template("admin_view.html",
                                student=student,
                                pv=pv,
                                tv=tv,
                                audio_url=audio_url,
                                images=images_data,
                                collective_analysis=collective_analysis)

    except Exception as e:
        print("Error in admin_decision:", e)
        return "Something went wrong.", 500


@admin_bp.route("/approved-students")
def approved_students():
    """Show list of all APPROVED students"""
    if 'role' not in session or session.get('role') != 'admin':
        return redirect(url_for('auth.login'))
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                s.studentId,
                s.name,
                s.district,
                s.gender,
                s.phone,
                s.email,
                s.virtual_interview_status,
                s.virtual_interview_date,
                s.virtual_interview_remarks,
                s.physical_interview_status,
                s.physical_interview_date,
                s.physical_interview_remarks,
                sd.scholarshipId,
                sd.batch,
                sd.stream,
                sd.college,
                sd.branch,
                tv.status as televerification_status,
                tv.comments as televerification_comments,
                tv.verificationDate as televerification_date
            FROM Student s
            LEFT JOIN ScholarshipDetails sd ON s.studentId = sd.studentId
            LEFT JOIN TeleVerification tv ON s.studentId = tv.studentId
            WHERE s.status = 'APPROVED'
            ORDER BY s.studentId DESC
        """)
        
        students = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return render_template("approved_students.html", students=students)
        
    except Exception as e:
        print(f"Error loading approved students: {e}")
        return "Error loading approved students", 500


# =====================================================
# API ENDPOINTS
# =====================================================

@admin_bp.route("/api/pending-students")
def api_admin_pending_students():
    """API endpoint for pending students"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401

    rows = fetchall_dict("""
        SELECT 
            s.studentId,
            s.name,
            s.district,
            s.status,
            pv.comment,
            pv.elementsSummary,
            pv.sentiment_text,
            pv.status AS pv_status
        FROM student s
        INNER JOIN PhysicalVerification pv 
            ON s.studentId = pv.studentId
        WHERE 
            pv.status IS NOT NULL
            AND pv.status != 'PROCESSING'
            AND (s.status IS NULL OR s.status = 'PENDING')
    """)
    return jsonify({'students': rows})


@admin_bp.route("/api/student/<student_id>")
def api_admin_student_details(student_id):
    """API endpoint to get full student details for React Admin View"""
    if 'role' not in session or session.get('role') not in ['admin', 'tv_admin']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True, buffered=True)

        # Fetch student row
        cursor.execute("SELECT * FROM student WHERE studentId = %s", (student_id,))
        student = cursor.fetchone()

        # Fetch physical verification row
        cursor.execute("SELECT * FROM PhysicalVerification WHERE studentId = %s ORDER BY verificationDate DESC LIMIT 1", (student_id,))
        pv = cursor.fetchone()
        
        # Fetch tele verification row
        cursor.execute("SELECT * FROM TeleVerification WHERE studentId = %s ORDER BY verificationDate DESC LIMIT 1", (student_id,))
        tv = cursor.fetchone()

        # Fetch audio S3 key and generate presigned URL
        audio_url = None
        try:
            cursor.execute("SELECT audio_s3_key FROM PhysicalVerification WHERE studentId = %s AND audio_s3_key IS NOT NULL LIMIT 1", (student_id,))
            audio_row = cursor.fetchone()
            if audio_row and audio_row['audio_s3_key']:
                audio_url = generate_presigned_url(audio_row['audio_s3_key'], 3600)
        except Exception:
            pass

        # Fetch images & analysis
        cursor.execute("""
            SELECT 
                fi.imageUrl, 
                ia.conditionResult, 
                ia.issuesFound,
                ia.qualityStatus
            FROM FinalImages fi
            LEFT JOIN ImageAnalysis ia ON fi.analysisId = ia.analysisId
            WHERE fi.studentId = %s
        """, (student_id,))
        
        image_rows = cursor.fetchall()
        
        # Fetch 10th marks
        cursor.execute("SELECT * FROM marks_10th WHERE studentId = %s", (student_id,))
        marks10_row = cursor.fetchone()
        marks10 = None
        if marks10_row:
            marks10 = {
                'tamil': marks10_row.get('tamil'),
                'english': marks10_row.get('english'),
                'maths': marks10_row.get('maths'),
                'science': marks10_row.get('science'),
                'social': marks10_row.get('social'),
                'total': marks10_row.get('total')
            }
        
        # Fetch 12th marks
        cursor.execute("SELECT * FROM marks_12th WHERE studentId = %s", (student_id,))
        marks12_row = cursor.fetchone()
        marks12 = None
        if marks12_row:
            marks12 = {
                'tamil': marks12_row.get('tamil'),
                'english': marks12_row.get('english'),
                'maths': marks12_row.get('maths'),
                'physics': marks12_row.get('physics'),
                'chemistry': marks12_row.get('chemistry'),
                'total': marks12_row.get('total'),
                'cutoff': marks12_row.get('cutoff')
            }
        
        # Collective analysis
        cursor.execute("""
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
        analysis_row = cursor.fetchone()
        
        collective_analysis = []
        if analysis_row and analysis_row['issuesFound']:
            try:
                if isinstance(analysis_row['issuesFound'], str):
                    collective_analysis = json.loads(analysis_row['issuesFound'])
                else:
                    collective_analysis = analysis_row['issuesFound']
            except:
                collective_analysis = []
        
        images_data = []
        for row in image_rows:
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

        cursor.close()
        conn.close()

        if not student:
            return jsonify({'error': 'Student not found'}), 404

        return jsonify({
            'student': student,
            'pv': pv,
            'tv': tv,
            'audio_url': audio_url,
            'images': images_data,
            'collective_analysis': collective_analysis,
            'marks10': marks10,
            'marks12': marks12
        })

    except Exception as e:
        print("Error in api_admin_student_details:", e)
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/final_status_update/<student_id>", methods=["POST"])
def final_status_update(student_id):
    """Update final admin decision"""
    if 'role' not in session or session.get('role') != 'admin':
        flash("Unauthorized access!", "danger")
        return redirect(url_for('auth.login'))
    
    if request.is_json:
        admin_status = request.json.get("admin_status")
        admin_remarks = request.json.get("admin_remarks", "")
    else:
        admin_status = request.form.get("admin_status")
        admin_remarks = request.form.get("admin_remarks", "")

    print("Received admin status:", admin_status)
    print("Received admin remarks:", admin_remarks)

    if not admin_status:
        if request.is_json:
            return jsonify({'success': False, 'error': 'No status provided'}), 400
        flash("Please select a final decision!", "danger")
        return redirect(url_for("admin.admin_decision", student_id=student_id))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Map admin decision to selected flag
        selected_flag = 1 if admin_status in ['APPROVED', 'SELECT'] else 0
        
        cursor.execute("""
            UPDATE student 
            SET status = %s,
                selected = %s,
                admin_remarks = %s
            WHERE studentId = %s
        """, (admin_status, selected_flag, admin_remarks, student_id))

        conn.commit()
        
        # Update RAG with admin's decision
        try:
            cursor2 = conn.cursor(dictionary=True)
            
            # Get student info
            cursor2.execute("SELECT district FROM Student WHERE studentId=%s", (student_id,))
            student_row = cursor2.fetchone()
            district = student_row['district'] if student_row else "Unknown"
            
            # Get PV data
            cursor2.execute("""
                SELECT comment, elementsSummary, sentiment_text, voice_comments
                FROM PhysicalVerification 
                WHERE studentId=%s 
                ORDER BY verificationDate DESC LIMIT 1
            """, (student_id,))
            pv_row = cursor2.fetchone()
            
            # Get house analysis
            cursor2.execute("""
                SELECT issuesFound 
                FROM ImageAnalysis 
                WHERE studentId=%s 
                ORDER BY analysisId DESC LIMIT 1
            """, (student_id,))
            analysis_row = cursor2.fetchone()
            
            cursor2.close()
            
            if pv_row:
                # Don't combine - pass separately to RAG
                add_student_case(
                    student_id=student_id,
                    district=district,
                    decision=admin_status,  # Final decision
                    score=float(pv_row.get('sentiment_text', 0) or 0),
                    comments=pv_row.get('comment', ''),
                    summary=pv_row.get('elementsSummary', ''),
                    voice_comments=pv_row.get('voice_comments', ''),
                    house_analysis=analysis_row.get('issuesFound', '') if analysis_row else '',
                    verification_date=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    embedding=None,
                    ai_decision=pv_row.get('sentiment', ''),  # PhysicalVerification.sentiment - AI decision
                    admin_decision=admin_status,  # Student.status - Admin final decision (APPROVED/REJECTED)
                    admin_remarks=admin_remarks  # Admin remarks stored separately
                )
                print(f"✅ Added case to RAG - AI: {pv_row.get('sentiment', '')}, Admin: {admin_status}, Remarks: {'Yes' if admin_remarks else 'No'}")
            
        except Exception as rag_error:
            print(f"⚠️ Failed to update RAG: {rag_error}")
        
        cursor.close()
        conn.close()

        flash("Final decision saved successfully!", "success")
        if request.is_json:
            return jsonify({'success': True, 'status': admin_status})
        return redirect(url_for("admin.admin_assign"))

    except Exception as e:
        print("Error in final_status_update:", e)
        if request.is_json:
            return jsonify({'success': False, 'error': str(e)}), 500
        flash("Error saving decision!", "danger")
        return redirect(url_for("admin.admin_decision", student_id=student_id))


@admin_bp.route("/interview-decision/<student_id>", methods=["POST"])
def interview_decision(student_id):
    """Handle virtual or physical interview decisions"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        interview_type = data.get('type')  # 'virtual' or 'physical'
        status = data.get('status')
        remarks = data.get('remarks', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if interview_type == 'virtual':
            cursor.execute("""
                UPDATE Student
                SET virtual_interview_status = %s,
                    virtual_interview_date = NOW(),
                    virtual_interview_remarks = %s
                WHERE studentId = %s
            """, (status, remarks, student_id))
        elif interview_type == 'physical':
            cursor.execute("""
                UPDATE Student
                SET physical_interview_status = %s,
                    physical_interview_date = NOW(),
                    physical_interview_remarks = %s
                WHERE studentId = %s
            """, (status, remarks, student_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Interview decision saved'})
        
    except Exception as e:
        print(f"Error in interview_decision: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# =====================================================
# PHYSICAL VERIFICATION WORKFLOW ENDPOINTS
# =====================================================

@admin_bp.route("/api/tv-selected-students")
def api_tv_selected_students():
    """Get students from TeleVerification with status='SELECTED' ready for PV assignment"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        rows = fetchall_dict("""
            SELECT 
                s.studentId,
                s.name,
                s.district,
                s.phone,
                s.email,
                s.gender,
                tv.status as tv_status,
                tv.verificationDate as tv_date,
                tv.comments as tv_comments,
                pv.volunteerId as assigned_volunteer_id,
                v.email as volunteer_email,
                v.volunteerId as volunteer_name
            FROM Student s
            INNER JOIN TeleVerification tv ON s.studentId = tv.studentId
            LEFT JOIN PhysicalVerification pv ON s.studentId = pv.studentId
            LEFT JOIN Volunteer v ON pv.volunteerId = v.volunteerId
            WHERE tv.status = 'VERIFIED'
            ORDER BY tv.verificationDate DESC
        """)
        return jsonify({'students': rows})
    except Exception as e:
        print(f"Error in api_tv_selected_students: {e}")
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/api/volunteers")
def api_volunteers():
    """Get all volunteers from Volunteer table"""
@admin_bp.route("/api/unassigned-tv-students")
def get_unassigned_tv_students():
    """Fetch students with status 'TV' who are not yet assigned to any volunteer"""
    if 'role' not in session or session.get('role') not in ['admin', 'tv_admin']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    query = """
        SELECT studentId, name, district, phone 
        FROM student 
        WHERE (status = 'TV' OR status IS NULL)
        AND studentId NOT IN (SELECT studentId FROM televerification)
    """
    students = fetchall_dict(query)
    return jsonify({'students': students})

@admin_bp.route("/api/tv-volunteers")
def get_tv_volunteers():
    """Fetch all volunteers with role 'tv'"""
    if 'role' not in session or session.get('role') not in ['admin', 'tv_admin']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    query = "SELECT volunteerId, name, email FROM volunteer WHERE role = 'tv'"
    volunteers = fetchall_dict(query)
    return jsonify({'volunteers': volunteers})

@admin_bp.route("/api/pv-volunteers")
def get_pv_volunteers():
    """Fetch all volunteers with role 'pv' for PV assignment"""
    if 'role' not in session or session.get('role') not in ['admin', 'tv_admin']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    query = "SELECT volunteerId, name, email FROM volunteer WHERE role = 'pv'"
    volunteers = fetchall_dict(query)
    return jsonify({'volunteers': volunteers})

@admin_bp.route("/api/assign-tv", methods=['POST'])
def assign_tv():
    """Assign students to a TV volunteer"""
    if 'role' not in session or session.get('role') not in ['admin', 'tv_admin']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    studentIds = data.get('studentIds', [])
    volunteerId = data.get('volunteerId')
    
    if not studentIds or not volunteerId:
        return jsonify({'error': 'Missing studentIds or volunteerId'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB Connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        for sid in studentIds:
            # Check if already exists (prevent duplicate assignments)
            cursor.execute("SELECT teleId FROM televerification WHERE studentId = %s", (sid,))
            if cursor.fetchone():
                continue
                
            cursor.execute("""
                INSERT INTO televerification (studentId, volunteerId, status, comments, verificationDate)
                VALUES (%s, %s, %s, %s, NOW())
            """, (sid, volunteerId, 'ASSIGNED', 'Assigned by Admin'))
            
            # Update student status to 'TV' if it was NULL (Application Received state)
            cursor.execute("UPDATE student SET status = 'TV' WHERE studentId = %s AND status IS NULL", (sid,))
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': f'Assigned {len(studentIds)} students'})
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/api/pv-statistics")
def api_pv_statistics():
    """Get PV assignment statistics for admin dashboard"""

    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # Get total students with TV status SELECTED
        total_tv_selected = fetchone_dict("""
            SELECT COUNT(*) as count
            FROM TeleVerification
            WHERE status = 'SELECTED'
        """)
        
        # Get students assigned to PV
        total_assigned = fetchone_dict("""
            SELECT COUNT(DISTINCT studentId) as count
            FROM PhysicalVerification
        """)
        
        # Get completed PV (status is not NULL and not PROCESSING)
        completed = fetchone_dict("""
            SELECT COUNT(*) as count
            FROM PhysicalVerification
            WHERE status IS NOT NULL AND status != 'PROCESSING'
        """)
        
        # Get pending PV (status IS NULL or PROCESSING)
        pending = fetchone_dict("""
            SELECT COUNT(*) as count
            FROM PhysicalVerification
            WHERE status IS NULL OR status = 'PROCESSING'
        """)
        
        return jsonify({
            'statistics': {
                'total_tv_selected': total_tv_selected['count'] or 0,
                'total_assigned': total_assigned['count'] or 0,
                'completed': completed['count'] or 0,
                'pending': pending['count'] or 0
            }
        })
        
    except Exception as e:
        print(f"Error fetching PV statistics: {e}")
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/api/assign-pv-volunteer", methods=["POST"])
def api_assign_pv_volunteer():
    """Assign a volunteer to a student for physical verification"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    
    data = request.json
    student_id = data.get('studentId')
    volunteer_id = data.get('volunteerId')
    volunteer_email = data.get('volunteerEmail')
    
    if not student_id:
        return jsonify({'error': 'studentId is required'}), 400
    
    # If email provided, lookup volunteerId
    if volunteer_email and not volunteer_id:
        volunteer_row = fetchone_dict(
            "SELECT volunteerId FROM Volunteer WHERE email = %s",
            (volunteer_email,)
        )
        if not volunteer_row:
            return jsonify({'error': 'Volunteer not found with that email'}), 404
        volunteer_id = volunteer_row['volunteerId']
    
    if not volunteer_id:
        return jsonify({'error': 'volunteerId or volunteerEmail is required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if assignment already exists
        cursor.execute("""
            SELECT * FROM PhysicalVerification 
            WHERE studentId = %s
        """, (student_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing assignment
            cursor.execute("""
                UPDATE PhysicalVerification
                SET volunteerId = %s,
                    status = NULL,
                    verificationDate = NULL
                WHERE studentId = %s
            """, (volunteer_id, student_id))
            message = 'Volunteer reassigned successfully'
        else:
            # Create new assignment
            cursor.execute("""
                INSERT INTO PhysicalVerification (studentId, volunteerId, status)
                VALUES (%s, %s, NULL)
            """, (student_id, volunteer_id))
            message = 'Volunteer assigned successfully'
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': message})
        
    except Exception as e:
        print(f"Error in api_assign_pv_volunteer: {e}")
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/api/completed-pv-students")
def api_completed_pv_students():
    """Get students with completed physical verification"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        rows = fetchall_dict("""
            SELECT 
                s.studentId,
                s.name,
                s.district,
                s.phone,
                s.status as student_status,
                pv.status as pv_status,
                pv.sentiment,
                pv.sentiment_text,
                pv.verificationDate,
                v.volunteerId,
                v.email as volunteer_email
            FROM Student s
            INNER JOIN PhysicalVerification pv ON s.studentId = pv.studentId
            LEFT JOIN Volunteer v ON pv.volunteerId = v.volunteerId
            WHERE pv.status IS NOT NULL 
                AND pv.status != 'PROCESSING'
            ORDER BY pv.verificationDate DESC
        """)
        return jsonify({'students': rows})
    except Exception as e:
        print(f"Error in api_completed_pv_students: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/api/submitted-tv-reports")
def get_submitted_tv_reports():
    """Fetch students with submitted TV reports for admin review"""
    if 'role' not in session or session.get('role') not in ['admin', 'tv_admin']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    query = """
        SELECT 
            s.studentId, 
            s.name, 
            s.district, 
            v.name as volunteerName,
            tv.status as tvStatus,
            tv.comments as tvComments,
            tv.verificationDate
        FROM student s
        JOIN televerification tv ON s.studentId = tv.studentId
        JOIN volunteer v ON tv.volunteerId = v.volunteerId
        WHERE tv.status IN ('VERIFIED', 'REJECTED')
        AND s.status = 'TV'
    """
    reports = fetchall_dict(query)
    return jsonify({'reports': reports})

@admin_bp.route("/api/review-tv-submission", methods=['POST'])
def review_tv_submission():
    """Admin decision on TV submission (move to PV or Reject)"""
    if 'role' not in session or session.get('role') not in ['admin', 'tv_admin']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    studentId = data.get('studentId')
    decision = data.get('decision') # 'SELECT' (moves to PV) or 'REJECT'
    remarks = data.get('remarks', '')
    
    if not studentId or not decision:
        return jsonify({'error': 'Missing studentId or decision'}), 400
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        target_status = 'PV' if decision == 'SELECT' else 'REJECTED'
        
        cursor.execute("""
            UPDATE student 
            SET status = %s, admin_remarks = %s 
            WHERE studentId = %s
        """, (target_status, remarks, studentId))
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': f'Student moved to {target_status}'})
    except Exception as e:
        print(e)

        return jsonify({'error': str(e)}), 500