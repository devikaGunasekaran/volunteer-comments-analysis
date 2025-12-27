"""
Authentication Routes
Handles login, logout, and session management
"""
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from backend.models.database import get_db_connection

auth_bp = Blueprint('auth', __name__)


@auth_bp.route("/", methods=["GET", "POST"])
def login():
    """Login page and authentication"""
    if request.method == "POST":
        volunteerId = request.form.get("volunteerId")
        password = request.form.get("password")

        conn = get_db_connection()
        if conn:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM Volunteer WHERE volunteerId=%s AND password=%s"
            cursor.execute(query, (volunteerId, password))
            volunteer = cursor.fetchone()
            cursor.close()
            conn.close()

            if volunteer:
                session['volunteerId'] = volunteer['volunteerId']
                session['role'] = volunteer['role']
                flash("Login successful!", "success")
                
                # Redirect based on role
                if volunteer['role'] == 'pv':
                    return redirect(url_for('volunteer.students_assign'))
                elif volunteer['role'] == 'admin':
                    return redirect(url_for('admin.admin_assign'))
                else:
                    return redirect(url_for('volunteer.students_assign'))
            else:
                flash("Invalid credentials!", "danger")
                return redirect(url_for('auth.login'))
    return render_template("login_page.html")


@auth_bp.route("/api/login", methods=["POST"])
def api_login():
    """API login endpoint for React frontend"""
    data = request.json
    volunteerId = data.get("volunteerId")
    password = data.get("password")

    if not volunteerId or not password:
        return jsonify({
            "success": False,
            "message": "Volunteer ID and password are required"
        }), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM Volunteer WHERE volunteerId=%s AND password=%s"
        cursor.execute(query, (volunteerId, password))
        volunteer = cursor.fetchone()
        cursor.close()
        conn.close()

        if volunteer:
            # Store in session for compatibility
            session['volunteerId'] = volunteer['volunteerId']
            session['role'] = volunteer['role']
            
            return jsonify({
                "success": True,
                "user": {
                    "volunteerId": volunteer['volunteerId'],
                    "role": volunteer['role'],
                    "name": volunteer.get('name', '')
                },
                "token": "simple_token_" + volunteer['volunteerId']  # TODO: Implement JWT
            })
        else:
            return jsonify({
                "success": False,
                "message": "Invalid credentials!"
            }), 401
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500


@auth_bp.route("/logout")
def logout():
    """Logout and clear session"""
    session.clear()
    return redirect(url_for("auth.login"))
