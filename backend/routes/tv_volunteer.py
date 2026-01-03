"""
TV Volunteer Routes
Handles televerification operations
"""
from flask import Blueprint, request, jsonify, session
from backend.models.database import get_db_connection, fetchall_dict

tv_volunteer_bp = Blueprint('tv_volunteer', __name__, url_prefix='/api/tv-volunteer')

@tv_volunteer_bp.route('/assigned-students', methods=['GET'])
def get_assigned_students():
    # Role check
    if 'volunteerId' not in session or session.get('role') != 'tv':
        return jsonify({'error': 'Unauthorized'}), 401

    # Try to get volunteerId from session, fallback to query param for flexibility
    volunteerId = session.get('volunteerId') or request.args.get('volunteerId')
    
    if not volunteerId:
        return jsonify({'error': 'Volunteer ID required'}), 400

    query = """
        SELECT 
            s.studentId, 
            s.name, 
            s.phone, 
            s.district, 
            tv.status,
            tv.comments,
            tv.verificationDate
        FROM student s
        JOIN televerification tv ON s.studentId = tv.studentId
        WHERE tv.volunteerId = %s 
        AND (tv.status IS NULL OR tv.status = 'PENDING' OR tv.status = 'ASSIGNED')
    """
    # Note: Removed LEFT JOIN and EXISTS check as it was redundant if the assignment is in televerification.
    # The requirement "remove from list after submission" is handled by the status filter.
    
    students = fetchall_dict(query, (volunteerId,))
    return jsonify({'students': students})

@tv_volunteer_bp.route('/submit', methods=['POST'])
def submit_verification():
    data = request.json
    studentId = data.get('studentId')
    
    # Try session first, then body (though body is less secure for ID, acceptable for internal tool if consistent)
    volunteerId = session.get('volunteerId') or data.get('volunteerId')
    
    status = data.get('status')
    comments = data.get('comments')
    
    # DEBUG LOGGING TO FILE
    with open('tv_debug.log', 'a') as f:
        f.write(f"DEBUG: TV Submit - Data: {data}, Session Volunteer: {session.get('volunteerId')}\n")
    
    if not studentId or not volunteerId:
        with open('tv_debug.log', 'a') as f:
            f.write("DEBUG: Missing IDs\n")
        return jsonify({'success': False, 'message': 'Missing IDs'}), 400
        
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'DB Error'}), 500
        
    try:
        cursor = conn.cursor()
        
        # Check if record exists (it should if they are assigned)
        check_query = "SELECT teleId, status FROM televerification WHERE studentId=%s AND volunteerId=%s"
        cursor.execute(check_query, (studentId, volunteerId))
        existing_record = cursor.fetchone()
        
        with open('tv_debug.log', 'a') as f:
            f.write(f"DEBUG: Existing Record for {studentId}/{volunteerId}: {existing_record}\n")
        
        if existing_record:
            update_query = """
                UPDATE televerification 
                SET status=%s, comments=%s, verificationDate=NOW()
                WHERE studentId=%s AND volunteerId=%s
            """
            cursor.execute(update_query, (status, comments, studentId, volunteerId))
            with open('tv_debug.log', 'a') as f:
                f.write(f"DEBUG: Updated row count: {cursor.rowcount}\n")
        else:
            with open('tv_debug.log', 'a') as f:
                f.write("DEBUG: Inserting new record\n")
            # Fallback: create if missing (though strictly they should be assigned first)
            insert_query = """
                INSERT INTO televerification (studentId, volunteerId, status, comments, verificationDate)
                VALUES (%s, %s, %s, %s, NOW())
            """
            cursor.execute(insert_query, (studentId, volunteerId, status, comments))
            
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': 'Verification submitted'})
        
    except Exception as e:
        with open('tv_debug.log', 'a') as f:
            f.write(f"DEBUG: Error in submit: {e}\n")
        return jsonify({'success': False, 'message': str(e)}), 500
