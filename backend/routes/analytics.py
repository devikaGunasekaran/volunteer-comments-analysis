"""
Analytics Routes
Handles analytics dashboard and API endpoints for statistics
"""
from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from backend.models.database import get_db_connection

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


@analytics_bp.route("/overview")
def api_analytics_overview():
    """Get overview stats: total, selected, rejected, pending"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as selected,
              SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
              SUM(CASE WHEN status = 'PENDING' OR status IS NULL THEN 1 ELSE 0 END) as pending
            FROM Student s
            WHERE EXISTS (
              SELECT 1 FROM PhysicalVerification pv 
              WHERE pv.studentId = s.studentId
            )
        """)
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in analytics overview: {e}")
        return jsonify({'error': str(e)}), 500


@analytics_bp.route("/ai-accuracy")
def api_analytics_ai_accuracy():
    """Get AI prediction accuracy compared to admin decisions"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
              COUNT(*) as total,
              SUM(CASE 
                WHEN (selected = '1' AND status = 'APPROVED') OR 
                     (selected = '0' AND status = 'REJECTED')
                THEN 1 ELSE 0 
              END) as correct,
              SUM(CASE 
                WHEN (selected = '1' AND status = 'REJECTED') OR 
                     (selected = '0' AND status = 'APPROVED')
                THEN 1 ELSE 0 
              END) as wrong
            FROM Student
            WHERE status IN ('APPROVED', 'REJECTED')
        """)
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        # Calculate percentage
        if result and result['total'] > 0:
            result['accuracy_percent'] = round((result['correct'] / result['total']) * 100, 2)
        else:
            result = {'total': 0, 'correct': 0, 'wrong': 0, 'accuracy_percent': 0}
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in AI accuracy: {e}")
        return jsonify({'error': str(e)}), 500


@analytics_bp.route("/ai-errors")
def api_analytics_ai_errors():
    """Get breakdown of AI prediction errors"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # False Positives
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM Student
            WHERE selected = '1' AND status = 'REJECTED'
        """)
        false_positives = cursor.fetchone()['count']
        
        # False Negatives
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM Student
            WHERE selected = '0' AND status = 'APPROVED'
        """)
        false_negatives = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'false_positives': false_positives,
            'false_negatives': false_negatives,
            'total_errors': false_positives + false_negatives
        })
        
    except Exception as e:
        print(f"Error in AI errors: {e}")
        return jsonify({'error': str(e)}), 500


@analytics_bp.route("/gender-distribution")
def api_analytics_gender_distribution():
    """Get gender-wise selection distribution"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
              gender,
              COUNT(*) as count
            FROM Student
            WHERE status = 'APPROVED'
            GROUP BY gender
        """)
        
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Format for easier frontend use
        data = {
            'male': 0,
            'female': 0
        }
        
        for row in results:
            if row['gender'] and row['gender'].lower() in ['male', 'm']:
                data['male'] = row['count']
            elif row['gender'] and row['gender'].lower() in ['female', 'f']:
                data['female'] = row['count']
        
        return jsonify(data)
        
    except Exception as e:
        print(f"Error in gender distribution: {e}")
        return jsonify({'error': str(e)}), 500


@analytics_bp.route("/rejected-distribution")
def api_analytics_rejected_distribution():
    """Get gender-wise rejected distribution"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
              gender,
              COUNT(*) as count
            FROM Student
            WHERE status = 'REJECTED'
            GROUP BY gender
        """)
        
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Format for easier frontend use
        data = {
            'male': 0,
            'female': 0
        }
        
        for row in results:
            if row['gender'] and row['gender'].lower() in ['male', 'm']:
                data['male'] = row['count']
            elif row['gender'] and row['gender'].lower() in ['female', 'f']:
                data['female'] = row['count']
        
        return jsonify(data)
        
    except Exception as e:
        print(f"Error in rejected distribution: {e}")
        return jsonify({'error': str(e)}), 500


@analytics_bp.route("/department-stats")
def api_analytics_department_stats():
    """Get department/stream-wise statistics"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
              sd.stream,
              s.gender,
              COUNT(*) as count
            FROM Student s
            JOIN ScholarshipDetails sd ON s.studentId = sd.studentId
            WHERE s.status = 'APPROVED'
            GROUP BY sd.stream, s.gender
        """)
        
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Format data
        data = {}
        for row in results:
            stream = row['stream'] or 'Unknown'
            gender = 'male' if row['gender'] and row['gender'].lower() in ['male', 'm'] else 'female'
            
            if stream not in data:
                data[stream] = {'male': 0, 'female': 0}
            
            data[stream][gender] = row['count']
        
        return jsonify(data)
        
    except Exception as e:
        print(f"Error in department stats: {e}")
        return jsonify({'error': str(e)}), 500


@analytics_bp.route("/batch-stats")
def api_analytics_batch_stats():
    """Get statistics filtered by batch year"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    batch_year = request.args.get('year', '')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        if batch_year:
            cursor.execute("""
                SELECT 
                  COUNT(*) as total,
                  SUM(CASE WHEN s.gender IN ('male', 'M') THEN 1 ELSE 0 END) as male,
                  SUM(CASE WHEN s.gender IN ('female', 'F') THEN 1 ELSE 0 END) as female
                FROM Student s
                JOIN ScholarshipDetails sd ON s.studentId = sd.studentId
                WHERE s.status = 'APPROVED' AND sd.batch = %s
            """, (batch_year,))
        else:
            cursor.execute("""
                SELECT 
                  COUNT(*) as total,
                  SUM(CASE WHEN gender IN ('male', 'M') THEN 1 ELSE 0 END) as male,
                  SUM(CASE WHEN gender IN ('female', 'F') THEN 1 ELSE 0 END) as female
                FROM Student
                WHERE status = 'APPROVED'
            """)
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return jsonify(result or {'total': 0, 'male': 0, 'female': 0})
        
    except Exception as e:
        print(f"Error in batch stats: {e}")
        return jsonify({'error': str(e)}), 500


@analytics_bp.route("/yearly-trends")
def api_analytics_yearly_trends():
    """Get historical trends by year and stream"""
    if 'role' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
              sd.batch,
              sd.stream,
              COUNT(*) as count
            FROM Student s
            JOIN ScholarshipDetails sd ON s.studentId = sd.studentId
            WHERE s.status = 'APPROVED'
            GROUP BY sd.batch, sd.stream
            ORDER BY sd.batch
        """)
        
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Format data by year
        data = {}
        for row in results:
            batch = row['batch']
            stream = row['stream'] or 'Unknown'
            count = row['count']
            
            if batch not in data:
                data[batch] = {}
            
            data[batch][stream] = count
        
        return jsonify(data)
        
    except Exception as e:
        print(f"Error in yearly trends: {e}")
        return jsonify({'error': str(e)}), 500


# Analytics dashboard page route
def register_analytics_page(app):
    """Register analytics dashboard page route"""
    @app.route("/admin/analytics")
    def admin_analytics():
        """Analytics dashboard page"""
        if 'role' not in session or session.get('role') != 'admin':
            return redirect(url_for('auth.login'))
        
        return render_template("admin_analytics.html")
