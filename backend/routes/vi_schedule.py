"""
Virtual Interview Scheduling API Endpoints
Handles Google Meet scheduling for VI volunteers
"""

from flask import Blueprint, request, jsonify, session
from backend.models.database import get_db_connection
from backend.services.google_calendar_service import (
    create_vi_meeting,
    update_vi_meeting,
    cancel_vi_meeting,
    get_meeting_details
)
from datetime import datetime
import pytz

vi_schedule_bp = Blueprint('vi_schedule', __name__)

IST = pytz.timezone('Asia/Kolkata')


@vi_schedule_bp.route('/api/vi/schedule-interview', methods=['POST'])
def schedule_interview():
    """
    Schedule Virtual Interview with Google Meet
    
    Request Body:
        {
            "studentId": "STU001",
            "volunteerId": "VOL001",
            "scheduledTime": "2026-01-15T15:00:00",  # ISO format
            "duration": 60  # optional, default 60 minutes
        }
    
    Returns:
        {
            "success": true,
            "meetLink": "https://meet.google.com/xxx-xxxx-xxx",
            "calendarLink": "https://calendar.google.com/...",
            "scheduledTime": "2026-01-15T15:00:00+05:30"
        }
    """
    # Check authentication
    # TEMPORARILY DISABLED FOR TESTING - RE-ENABLE IN PRODUCTION
    # if 'role' not in session or session.get('role') not in ['superadmin', 'vi_volunteer']:
    #     return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        student_id = data.get('studentId')
        volunteer_id = data.get('volunteerId')
        scheduled_time_str = data.get('scheduledTime')
        duration = data.get('duration', 60)
        
        if not all([student_id, volunteer_id, scheduled_time_str]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Parse scheduled time
        scheduled_time = datetime.fromisoformat(scheduled_time_str.replace('Z', '+00:00'))
        if scheduled_time.tzinfo is None:
            scheduled_time = IST.localize(scheduled_time)
        
        # Get student and volunteer details
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get student info
        cursor.execute("""
            SELECT name, email FROM Student WHERE studentId = %s
        """, (student_id,))
        student = cursor.fetchone()
        
        if not student or not student.get('email'):
            cursor.close()
            conn.close()
            return jsonify({'error': 'Student not found or email missing'}), 404
        
        # Get volunteer info
        cursor.execute("""
            SELECT name, email FROM Volunteer WHERE volunteerId = %s
        """, (volunteer_id,))
        volunteer = cursor.fetchone()
        
        if not volunteer or not volunteer.get('email'):
            cursor.close()
            conn.close()
            return jsonify({'error': 'Volunteer not found or email missing'}), 404
        
        # Create Google Meet meeting
        meeting_result = create_vi_meeting(
            student_name=student['name'],
            student_email=student['email'],
            volunteer_name=volunteer['name'],
            volunteer_email=volunteer['email'],
            scheduled_time=scheduled_time,
            duration_minutes=duration,
            student_id=student_id
        )
        
        if meeting_result['status'] != 'created':
            cursor.close()
            conn.close()
            return jsonify({
                'error': 'Failed to create meeting',
                'details': meeting_result.get('error', 'Unknown error')
            }), 500
        
        # Update VirtualInterview table
        cursor.execute("""
            UPDATE VirtualInterview
            SET scheduled_time = %s,
                meet_link = %s,
                calendar_event_id = %s,
                meeting_duration = %s,
                meeting_status = 'scheduled'
            WHERE studentId = %s AND volunteerId = %s
        """, (
            scheduled_time,
            meeting_result['meet_link'],
            meeting_result['event_id'],
            duration,
            student_id,
            volunteer_id
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ VI scheduled: {student_id} with {volunteer_id} at {scheduled_time}")
        
        return jsonify({
            'success': True,
            'meetLink': meeting_result['meet_link'],
            'calendarLink': meeting_result['calendar_link'],
            'eventId': meeting_result['event_id'],
            'scheduledTime': scheduled_time.isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error scheduling interview: {e}")
        return jsonify({'error': str(e)}), 500


@vi_schedule_bp.route('/api/vi/reschedule-interview', methods=['POST'])
def reschedule_interview():
    """
    Reschedule existing Virtual Interview
    
    Request Body:
        {
            "studentId": "STU001",
            "newTime": "2026-01-16T16:00:00"
        }
    """
    if 'role' not in session or session.get('role') not in ['superadmin', 'vi_volunteer']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        student_id = data.get('studentId')
        new_time_str = data.get('newTime')
        
        if not all([student_id, new_time_str]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Parse new time
        new_time = datetime.fromisoformat(new_time_str.replace('Z', '+00:00'))
        if new_time.tzinfo is None:
            new_time = IST.localize(new_time)
        
        # Get existing meeting details
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT calendar_event_id, meeting_duration
            FROM VirtualInterview
            WHERE studentId = %s AND meeting_status = 'scheduled'
        """, (student_id,))
        
        meeting = cursor.fetchone()
        
        if not meeting or not meeting.get('calendar_event_id'):
            cursor.close()
            conn.close()
            return jsonify({'error': 'No scheduled meeting found'}), 404
        
        # Update Google Calendar event
        update_result = update_vi_meeting(
            event_id=meeting['calendar_event_id'],
            new_time=new_time,
            new_duration=meeting.get('meeting_duration', 60)
        )
        
        if update_result['status'] != 'updated':
            cursor.close()
            conn.close()
            return jsonify({'error': 'Failed to reschedule meeting'}), 500
        
        # Update database
        cursor.execute("""
            UPDATE VirtualInterview
            SET scheduled_time = %s,
                meeting_status = 'rescheduled'
            WHERE studentId = %s
        """, (new_time, student_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ VI rescheduled: {student_id} to {new_time}")
        
        return jsonify({
            'success': True,
            'newTime': new_time.isoformat(),
            'meetLink': update_result['meet_link']
        })
        
    except Exception as e:
        print(f"❌ Error rescheduling interview: {e}")
        return jsonify({'error': str(e)}), 500


@vi_schedule_bp.route('/api/vi/get-meeting/<student_id>', methods=['GET'])
def get_meeting(student_id):
    """Get meeting details for a student"""
    if 'role' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                vi.scheduled_time,
                vi.meet_link,
                vi.calendar_event_id,
                vi.meeting_duration,
                vi.meeting_status,
                s.name as student_name,
                s.email as student_email,
                v.name as volunteer_name,
                v.email as volunteer_email
            FROM VirtualInterview vi
            JOIN Student s ON vi.studentId = s.studentId
            JOIN Volunteer v ON vi.volunteerId = v.volunteerId
            WHERE vi.studentId = %s
        """, (student_id,))
        
        meeting = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not meeting:
            return jsonify({'error': 'Meeting not found'}), 404
        
        return jsonify({
            'success': True,
            'meeting': {
                'scheduledTime': meeting['scheduled_time'].isoformat() if meeting['scheduled_time'] else None,
                'meetLink': meeting['meet_link'],
                'duration': meeting['meeting_duration'],
                'status': meeting['meeting_status'],
                'studentName': meeting['student_name'],
                'studentEmail': meeting['student_email'],
                'volunteerName': meeting['volunteer_name'],
                'volunteerEmail': meeting['volunteer_email']
            }
        })
        
    except Exception as e:
        print(f"❌ Error getting meeting: {e}")
        return jsonify({'error': str(e)}), 500


@vi_schedule_bp.route('/api/vi/available-slots', methods=['GET'])
def get_available_slots():
    """
    Get available time slots for scheduling
    Returns next 7 days, 9 AM - 5 PM slots
    """
    try:
        from datetime import date, timedelta
        
        slots = []
        today = date.today()
        
        # Generate slots for next 7 days
        for day_offset in range(1, 8):  # Tomorrow to 7 days ahead
            slot_date = today + timedelta(days=day_offset)
            
            # Skip Sundays
            if slot_date.weekday() == 6:
                continue
            
            # Generate hourly slots from 9 AM to 5 PM
            for hour in range(9, 18):  # 9 AM to 5 PM
                slot_time = datetime(
                    slot_date.year,
                    slot_date.month,
                    slot_date.day,
                    hour,
                    0,
                    0
                )
                slot_time = IST.localize(slot_time)
                
                slots.append({
                    'value': slot_time.isoformat(),
                    'label': slot_time.strftime('%A, %d %B %Y at %I:%M %p')
                })
        
        return jsonify({
            'success': True,
            'slots': slots
        })
        
    except Exception as e:
        print(f"❌ Error getting available slots: {e}")
        return jsonify({'error': str(e)}), 500
