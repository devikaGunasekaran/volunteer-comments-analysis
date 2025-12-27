"""
Authentication Routes
Handles login, logout, and session management
"""
from flask import Blueprint, render_template, request, redirect, url_for, session, flash
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


@auth_bp.route("/logout")
def logout():
    """Logout and clear session"""
    session.clear()
    return redirect(url_for("auth.login"))
