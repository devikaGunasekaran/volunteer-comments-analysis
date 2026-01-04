"""
Volunteer Routes
Handles PV volunteer operations including student assignments, image uploads, and PV submissions
"""
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from backend.models.database import get_db_connection, fetchone_dict, fetchall_dict
from backend.services.ai_service import ai_quality_check
from backend.services.s3_service import get_s3_client, upload_image_batch, generate_presigned_url
from backend.services.pv_process import pv_process
from backend.config import Config
import os
import base64
import threading
import traceback
import time
import json
import datetime
from io import BytesIO

volunteer_bp = Blueprint('volunteer', __name__)

# Get S3 client
s3 = get_s3_client()
BUCKET = Config.AWS_BUCKET
MIN_IMAGES_REQUIRED = Config.MIN_IMAGES_REQUIRED
UPLOAD_FOLDER = Config.UPLOAD_FOLDER


# =====================================================
# VOLUNTEER PAGES
# =====================================================

@volunteer_bp.route("/students-assign")
def students_assign():
    """PV volunteer dashboard - shows assigned students"""
    if 'volunteerId' not in session or session.get('role') != 'pv':
        flash("Unauthorized access!", "danger")
        return redirect(url_for('auth.login'))
    return render_template("students_assign.html")


@volunteer_bp.route("/student/<student_id>")
def student_details(student_id):
    """Student details page"""
    if 'volunteerId' not in session or session.get('role') != 'pv':
        flash("Unauthorized access!", "danger")
        return redirect(url_for('auth.login'))
    return render_template("students.html", studentId=student_id)


@volunteer_bp.route("/pv/<student_id>")
def pv_form(student_id):
    """Physical verification form page"""
    if 'volunteerId' not in session or session.get('role') != 'pv':
        flash("Unauthorized access!", "danger")
        return redirect(url_for('auth.login'))
    return render_template("pv.html", studentId=student_id)


# =====================================================
# API ENDPOINTS
# =====================================================

@volunteer_bp.route("/api/assigned-students")
def api_assigned_students():
    """Get students assigned to logged-in volunteer with statistics"""
    if 'volunteerId' not in session or session.get('role') != 'pv':
        return jsonify({'error': 'Unauthorized'}), 401

    volunteerId = session['volunteerId']

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)
    
    # Get pending students (status IS NULL)
    query = """
        SELECT s.studentId, s.name AS studentName, s.phone AS phoneNumber, s.district, pv.status
        FROM PhysicalVerification pv
        JOIN Student s ON pv.studentId = s.studentId
        WHERE pv.volunteerId = %s AND pv.status IS NULL
    """
    cursor.execute(query, (volunteerId,))
    students = cursor.fetchall()
    
    # Get statistics
    stats_query = """
        SELECT 
            COUNT(*) as total_assigned,
            SUM(CASE WHEN status IS NOT NULL AND status NOT IN ('ASSIGNED', 'PROCESSING') THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status IS NULL OR status = 'ASSIGNED' OR status = 'PROCESSING' THEN 1 ELSE 0 END) as pending
        FROM PhysicalVerification
        WHERE volunteerId = %s
    """
    cursor.execute(stats_query, (volunteerId,))
    stats = cursor.fetchone()
    
    cursor.close()
    conn.close()

    return jsonify({
        'students': students,
        'statistics': {
            'total_assigned': stats['total_assigned'] or 0,
            'completed': stats['completed'] or 0,
            'pending': stats['pending'] or 0
        }
    })


@volunteer_bp.route("/api/student/<student_id>")
def api_student_details(student_id):
    """Get full student details"""
    if 'volunteerId' not in session or session.get('role') not in ['pv', 'tv']:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM Student WHERE studentId=%s", (student_id,))
    student = cursor.fetchone()

    cursor.execute("SELECT * FROM Marks_10th WHERE studentId=%s", (student_id,))
    marks10 = cursor.fetchone()

    cursor.execute("SELECT * FROM Marks_12th WHERE studentId=%s", (student_id,))
    marks12 = cursor.fetchone()

    cursor.execute("""
        SELECT * FROM TeleVerification 
        WHERE studentId=%s ORDER BY verificationDate DESC LIMIT 1
    """, (student_id,))
    latest_tv = cursor.fetchone()

    cursor.execute("""
        SELECT * FROM PhysicalVerification
        WHERE studentId=%s ORDER BY verificationDate DESC LIMIT 1
    """, (student_id,))
    latest_pv = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        'student': student,
        'marks10': marks10,
        'marks12': marks12,
        'latest_tv': latest_tv,
        'latest_pv': latest_pv
    })


# =====================================================
# IMAGE UPLOAD ENDPOINTS
# =====================================================

@volunteer_bp.route("/api/temp-upload", methods=["POST"])
def temp_upload():
    """Temporary image upload with quality check"""
    studentId = request.form.get("studentId")
    file = request.files.get("image")

    if not studentId or not file:
        return jsonify({"error": "studentId and image required"}), 400

    image_bytes = file.read()

    # Quality check
    quality = ai_quality_check(image_bytes)
    if quality["status"] == "BAD":
        return jsonify({
            "accepted": False,
            "reason": quality["reason"]
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO StudentImages (studentId, tempImage, uploadedAt)
        VALUES (%s, %s, NOW())
    """, (studentId, image_bytes))

    conn.commit()

    cursor.execute(
        "SELECT COUNT(*) FROM StudentImages WHERE studentId=%s",
        (studentId,)
    )
    count = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return jsonify({
        "accepted": True,
        "uploaded_so_far": count
    })


@volunteer_bp.route("/api/batch-quality-check", methods=["POST"])
def batch_quality_check():
    """Check quality of multiple images in a single API call"""
    studentId = request.form.get("studentId")
    files = request.files.getlist("images")

    if not studentId or not files:
        return jsonify({"error": "studentId and images required"}), 400

    results = []
    
    for file in files:
        try:
            image_bytes = file.read()
            
            # Quality check
            quality = ai_quality_check(image_bytes)
            
            results.append({
                "filename": file.filename,
                "status": quality["status"],
                "reason": quality.get("reason", "")
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "BAD",
                "reason": f"Error: {str(e)}"
            })

    return jsonify({"results": results})


@volunteer_bp.route("/api/final-upload-batch", methods=["POST"])
def final_upload_batch():
    """Upload accepted images from batch quality check (parallel S3 uploads)"""
    studentId = request.form.get("studentId")
    files = request.files.getlist("images")

    if not studentId or not files:
        return jsonify({"error": "studentId and images required"}), 400

    if len(files) < MIN_IMAGES_REQUIRED:
        return jsonify({
            "error": f"Minimum {MIN_IMAGES_REQUIRED} images required"
        }), 400

    try:
        from concurrent.futures import ThreadPoolExecutor, as_completed

        # Prepare image data
        image_data = []
        for file in files:
            image_bytes = file.read()
            timestamp = int(time.time() * 1000)
            key = f"uploads/{studentId}/{timestamp}_{file.filename}"
            image_data.append({
                'bytes': image_bytes,
                'key': key,
                'filename': file.filename
            })

        # Parallel S3 upload function
        def upload_to_s3(data):
            try:
                s3.upload_fileobj(BytesIO(data['bytes']), BUCKET, data['key'])
                return {'success': True, 'key': data['key']}
            except Exception as e:
                return {'success': False, 'error': str(e), 'filename': data['filename']}

        # Upload all images in parallel
        uploaded_keys = []
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(upload_to_s3, data) for data in image_data]
            
            for future in as_completed(futures):
                result = future.result()
                if result['success']:
                    uploaded_keys.append(result['key'])
                else:
                    print(f"❌ S3 upload failed for {result['filename']}: {result['error']}")

        # Insert into database (batch insert)
        if uploaded_keys:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            try:
                insert_values = [(studentId, key) for key in uploaded_keys]
                cursor.executemany("""
                    INSERT INTO FinalImages (studentId, imageUrl)
                    VALUES (%s, %s)
                """, insert_values)
                
                conn.commit()
                cursor.close()
                conn.close()
                
                print(f"✅ Uploaded {len(uploaded_keys)} images in parallel")
                return jsonify({"success": True, "uploaded": len(uploaded_keys)})
                
            except Exception as e:
                conn.rollback()
                cursor.close()
                conn.close()
                print(f"❌ Database error: {e}")
                return jsonify({"error": f"Database error: {str(e)}"}), 500
        else:
            return jsonify({"error": "No images were uploaded successfully"}), 500

    except Exception as e:
        print(f"❌ Error in final_upload_batch: {e}")
        return jsonify({"error": str(e)}), 500


@volunteer_bp.route("/api/final-upload", methods=["POST"])
def final_upload():
    """Final upload from temp storage to S3"""
    studentId = request.json.get("studentId")
    if not studentId:
        return jsonify({"error": "studentId required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT imageId, tempImage FROM StudentImages WHERE studentId=%s",
        (studentId,)
    )
    images = cursor.fetchall()

    if len(images) < MIN_IMAGES_REQUIRED:
        return jsonify({
            "error": f"Minimum {MIN_IMAGES_REQUIRED} images required"
        }), 400

    results = []

    try:
        for imageId, img_bytes in images:
            print("▶ Processing imageId:", imageId)

            # Upload to S3
            key = f"uploads/{studentId}/{imageId}.jpg"
            s3.upload_fileobj(BytesIO(img_bytes), BUCKET, key)

            # Insert final image
            cursor.execute("""
                INSERT INTO FinalImages (
                    studentId,
                    imageUrl
                )
                VALUES (%s, %s)
            """, (
                studentId,
                key
            ))

            results.append({
                "imageId": imageId,
                "s3_key": key
            })

        cursor.execute(
            "DELETE FROM StudentImages WHERE studentId=%s",
            (studentId,)
        )
        conn.commit()

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        cursor.close()
        conn.close()

    return jsonify({
        "success": True,
        "results": results
    })


@volunteer_bp.route("/api/image-count/<studentId>")
def image_count(studentId):
    """Get count of uploaded images"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM StudentImages WHERE studentId=%s",
            (studentId,)
        )
        count = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        return jsonify({
            "studentId": studentId,
            "count": count
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to fetch image count",
            "details": str(e)
        }), 500


@volunteer_bp.route("/api/get-images/<studentId>")
def get_images(studentId):
    """Get presigned URLs for student images"""
    if 'volunteerId' not in session or session.get('role') not in ['pv', 'tv']:
        return jsonify({'error': 'Unauthorized'}), 401
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT imageUrl FROM FinalImages WHERE studentId=%s",
        (studentId,)
    )
    rows = cursor.fetchall()

    urls = [
        generate_presigned_url(key, 3600)
        for (key,) in rows
    ]

    cursor.close()
    conn.close()

    return jsonify({"images": urls})


# =====================================================
# PV SUBMISSION
# =====================================================

def run_pv_ai_pipeline(data, student_id, volunteer_id, recommendation):
    """Run AI pipeline in background thread"""
    try:
        from backend.services.rag_service import add_student_case

        text_comment = data.get("comments", "")
        is_tanglish = data.get("isTanglish", False)
        audio_base64 = data.get("voiceAudio", "")

        # Handle audio file - upload to S3
        audio_s3_key = None
        audio_path = None
        
        if audio_base64:
            try:
                header, encoded = audio_base64.split(",", 1)
                encoded += "=" * ((4 - len(encoded) % 4) % 4)
                audio_bytes = base64.b64decode(encoded)
                
                # Upload to S3
                audio_s3_key = f"audio/{student_id}.wav"
                s3.upload_fileobj(BytesIO(audio_bytes), BUCKET, audio_s3_key)
                print(f"✅ Audio uploaded to S3: {audio_s3_key}")
                
                # Save temporary file for processing
                audio_path = os.path.join(UPLOAD_FOLDER, f"{student_id}_temp.wav")
                with open(audio_path, "wb") as f:
                    f.write(audio_bytes)
                print(f"📁 Temp audio file created: {audio_path}")
                
            except Exception as e:
                print(f"❌ Error uploading audio: {e}")
                audio_s3_key = None
                audio_path = None

        # Fetch & download images
        image_paths = []
        try:
            conn = get_db_connection()
            if not conn:
                raise Exception("Database connection failed")
            cursor = conn.cursor()
            cursor.execute("SELECT imageUrl FROM FinalImages WHERE studentId=%s", (student_id,))
            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            for (s3_key,) in rows:
                local_filename = f"{student_id}_{os.path.basename(s3_key)}"
                local_path = os.path.join(UPLOAD_FOLDER, local_filename)
                
                # Download from S3
                s3.download_file(BUCKET, s3_key, local_path)
                image_paths.append(local_path)
                
        except Exception as img_err:
            print("⚠️ Failed to fetch/download images:", img_err)

        # Run AI pipeline
        result = pv_process(text_comment, audio_path, image_paths, is_tanglish)
        
        # Cleanup temporary files
        try:
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)
                print(f"🗑️ Deleted temp audio: {audio_path}")
            
            for img_path in image_paths:
                if os.path.exists(img_path):
                    os.remove(img_path)
                    print(f"🗑️ Deleted temp image: {img_path}")
        except Exception as cleanup_err:
            print(f"⚠️ Cleanup error: {cleanup_err}")

        english_comment = result.get("english_comment", "")
        voice_text = result.get("voice_text", "")
        summary_list = result.get("summary", [])
        decision = result.get("decision", "ON HOLD")
        score = float(result.get("score", 0.0))
        
        # House analysis
        house_analysis_raw = result.get("house_analysis") or {}
        house_points = []
        house_condition = "Analyzed"

        try:
            if isinstance(house_analysis_raw, list):
                house_points = house_analysis_raw
                house_condition = "Analyzed"
            elif isinstance(house_analysis_raw, dict):
                house_points = house_analysis_raw.get("points", [])
                house_condition = house_analysis_raw.get("condition", "Analyzed")
        except Exception as e:
            print(f"⚠️ Error parsing house analysis: {e}")
            house_points = []
            house_condition = "Error"

        summary_text = "; ".join(summary_list)

        # Update database
        conn = get_db_connection()
        if not conn:
            raise Exception("Database connection failed")
        cursor = conn.cursor()

        # Fetch student district for RAG
        cursor.execute("SELECT district FROM Student WHERE studentId=%s", (student_id,))
        student_row = cursor.fetchone()
        student_district = student_row[0] if student_row else "Unknown"

        # Combine summaries
        final_summary_text = "TEXT/AUDIO SUMMARY:\n" + "; ".join(summary_list)

        # Insert house analysis
        if house_points:
            try:
                house_analysis_json = json.dumps(house_points)
                cursor.execute("""
                    INSERT INTO ImageAnalysis (studentId, issuesFound, conditionResult, qualityStatus)
                    VALUES (%s, %s, %s, %s)
                """, (student_id, house_analysis_json, house_condition, "GOOD"))
                
                new_analysis_id = cursor.lastrowid
                
                cursor.execute("""
                    UPDATE FinalImages 
                    SET analysisId = %s 
                    WHERE studentId = %s
                """, (new_analysis_id, student_id))
                
            except Exception as e:
                print("⚠️ Failed to save house analysis:", e)

        # Update PV with AI results and final status
        cursor.execute("""
            UPDATE PhysicalVerification
            SET 
                comment=%s,
                elementsSummary=%s,
                sentiment=%s,
                sentiment_text=%s,
                voice_comments=%s,
                status=%s,
                audio_s3_key=%s,
                verificationDate=NOW()
            WHERE studentId=%s AND volunteerId=%s
        """, (
            english_comment,
            final_summary_text,
            decision,
            score,
            voice_text,
            recommendation,
            audio_s3_key,
            student_id,
            volunteer_id
        ))

        conn.commit()
        cursor.close()
        conn.close()

        # Update RAG knowledge base
        try:
            add_student_case(
                student_id=student_id,
                district=student_district,
                decision=decision,  # AI sentiment decision
                score=score,
                comments=english_comment,
                summary=summary_text,
                voice_comments=voice_text,
                house_analysis=json.dumps(house_points) if house_points else "",
                verification_date=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                embedding=result.get('query_embedding'),
                ai_decision=decision,  # PhysicalVerification.sentiment - AI sentiment decision
                admin_decision="",  # Not yet decided by admin (Student.status will be set later)
                admin_remarks=""  # No admin remarks yet
            )
            print(f"✅ Added case to RAG knowledge base (AI Decision: {decision})")
        except Exception as rag_error:
            print(f"⚠️ Failed to update RAG: {rag_error}")

        print("✅ PV async AI pipeline finished successfully.")

    except Exception as e:
        print("❌ ASYNC AI PIPELINE ERROR:", e)
        traceback.print_exc()


@volunteer_bp.route("/api/submit-pv", methods=["POST"])
def submit_pv():
    """Submit physical verification form"""
    try:
        data = request.json
        student_id = data.get("studentId")
        volunteer_id = session.get("volunteerId")

        if not student_id or not volunteer_id:
            return jsonify({"success": False, "message": "Missing IDs"}), 400

        conn = get_db_connection()
        if not conn:
            raise Exception("Database connection failed")
        cursor = conn.cursor()

        recommendation = data.get("recommendation")

        # Update with PROCESSING status
        cursor.execute("""
            UPDATE PhysicalVerification
            SET 
                propertyType=%s,
                whatYouSaw=%s,
                status='PROCESSING'
            WHERE studentId=%s AND volunteerId=%s
        """, (
            data.get("propertyType"),
            data.get("whatYouSaw"),
            student_id,
            volunteer_id
        ))

        conn.commit()
        cursor.close()
        conn.close()

        # Start AI in background
        threading.Thread(
            target=run_pv_ai_pipeline, 
            args=(data, student_id, volunteer_id, recommendation),
            daemon=True
        ).start()

        return jsonify({"success": True, "message": "PV Updated. AI running."})

    except Exception as e:
        print("❌ Error in /submit-pv:", e)
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@volunteer_bp.route("/api/pv-status/<student_id>")
def api_pv_status(student_id):
    """Get PV status for polling"""
    if 'volunteerId' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    row = fetchone_dict("""
        SELECT studentId, volunteerId, status, elementsSummary, sentiment_text, voice_comments
        FROM PhysicalVerification
        WHERE studentId = %s
        ORDER BY verificationDate DESC LIMIT 1
    """, (student_id,))

    if not row:
        return jsonify({'exists': False, 'pv': None})
    return jsonify({'exists': True, 'pv': row})
