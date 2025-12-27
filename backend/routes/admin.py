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


@admin_bp.route("/final_status_update/<student_id>", methods=["POST"])
def final_status_update(student_id):
    """Update final admin decision"""
    if 'role' not in session or session.get('role') != 'admin':
        flash("Unauthorized access!", "danger")
        return redirect(url_for('auth.login'))
    
    admin_status = request.form.get("admin_status")

    print("Received admin status:", admin_status)

    if not admin_status:
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
                selected = %s
            WHERE studentId = %s
        """, (admin_status, selected_flag, student_id))

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
                add_student_case(
                    student_id=student_id,
                    district=district,
                    decision=admin_status,
                    score=float(pv_row.get('sentiment_text', 0) or 0),
                    comments=pv_row.get('comment', ''),
                    summary=pv_row.get('elementsSummary', ''),
                    voice_comments=pv_row.get('voice_comments', ''),
                    house_analysis=analysis_row.get('issuesFound', '') if analysis_row else '',
                    verification_date=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    embedding=None
                )
                print(f"✅ Added case to RAG with ADMIN decision: {admin_status}")
            
        except Exception as rag_error:
            print(f"⚠️ Failed to update RAG: {rag_error}")
        
        cursor.close()
        conn.close()

        flash("Final decision saved successfully!", "success")
        return redirect(url_for("admin.admin_assign"))

    except Exception as e:
        print("Error in final_status_update:", e)
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
