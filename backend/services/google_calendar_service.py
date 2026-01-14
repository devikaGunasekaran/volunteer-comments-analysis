"""
Google Calendar and Meet Integration Service
Handles automatic meeting scheduling for Virtual Interviews
"""

from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timedelta
import os
import json

# Configuration
SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
]

# Credentials Paths
CREDENTIALS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'credentials')
SERVICE_ACCOUNT_FILE = os.path.join(CREDENTIALS_DIR, 'service-account.json')
TOKEN_FILE = os.path.join(CREDENTIALS_DIR, 'token.json')


def get_calendar_service():
    """
    Initialize and return Google Calendar service
    Priority:
    1. OAuth 2.0 (token.json) - For personal Gmail & general use
    2. Service Account (service-account.json) - For Server-to-Server
    
    Returns:
        Google Calendar service object
    """
    try:
        credentials = None
        
        # 1. Try OAuth Token (token.json)
        if os.path.exists(TOKEN_FILE):
            # print("ℹ️  Using OAuth User Credentials (token.json)")
            from google.oauth2.credentials import Credentials
            credentials = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

        # 2. Try Service Account (service-account.json)
        elif os.path.exists(SERVICE_ACCOUNT_FILE):
            # print("ℹ️  Using Service Account Credentials")
            credentials = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE,
                scopes=SCOPES
            )
            
            # Check for impersonation (Domain-Wide Delegation)
            impersonated_user = os.environ.get('GOOGLE_IMPERSONATED_USER')
            if impersonated_user:
                credentials = credentials.with_subject(impersonated_user)

        else:
            raise FileNotFoundError("No valid credentials found (token.json or service-account.json)")

        service = build('calendar', 'v3', credentials=credentials)
        return service
    except Exception as e:
        print(f"❌ Error initializing Google Calendar service: {e}")
        raise e


def create_vi_meeting(
    student_name,
    student_email,
    volunteer_name,
    volunteer_email,
    scheduled_time,
    duration_minutes=60,
    student_id=None
):
    """
    Create Google Meet meeting for Virtual Interview
    
    Args:
        student_name (str): Student's full name
        student_email (str): Student's email address
        volunteer_name (str): Volunteer's full name
        volunteer_email (str): Volunteer's email address
        scheduled_time (datetime): Meeting start time
        duration_minutes (int): Meeting duration in minutes (default: 60)
        student_id (str): Optional student ID for reference
    
    Returns:
        dict: {
            'meet_link': str,
            'event_id': str,
            'calendar_link': str,
            'status': str
        }
    """
    try:
        service = get_calendar_service()
        
        # Calculate end time
        end_time = scheduled_time + timedelta(minutes=duration_minutes)
        
        # Create event description
        description = f"""
Virtual Interview - Scholarship Assessment

Student: {student_name}
{f'Student ID: {student_id}' if student_id else ''}
Volunteer: {volunteer_name}

Instructions:
1. Join the meeting 5 minutes before the scheduled time
2. Ensure you have a stable internet connection
3. Keep your camera and microphone ready
4. The interview will last approximately {duration_minutes} minutes

For any issues, please contact the admin team.
        """.strip()
        
        # Create event with Google Meet
        event = {
            'summary': f'Virtual Interview - {student_name}',
            'description': description,
            'start': {
                'dateTime': scheduled_time.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'attendees': [
                {'email': volunteer_email, 'displayName': volunteer_name},
                {'email': student_email, 'displayName': student_name},
            ],
            'conferenceData': {
                'createRequest': {
                    'requestId': f'vi-{student_id or "unknown"}-{int(scheduled_time.timestamp())}',
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'email', 'minutes': 60},       # 1 hour before
                    {'method': 'popup', 'minutes': 30},       # 30 minutes before
                ],
            },
            'guestsCanModify': False,
            'guestsCanInviteOthers': False,
            'guestsCanSeeOtherGuests': True,
        }
        
        # Create event
        created_event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1,
            sendUpdates='all'  # Send email to all attendees
        ).execute()
        
        print(f"✅ Meeting created successfully: {created_event.get('id')}")
        
        return {
            'meet_link': created_event.get('hangoutLink', ''),
            'event_id': created_event.get('id', ''),
            'calendar_link': created_event.get('htmlLink', ''),
            'status': 'created'
        }
        
    except HttpError as error:
        print(f"❌ Google Calendar API error: {error}")
        return {
            'meet_link': '',
            'event_id': '',
            'calendar_link': '',
            'status': 'failed',
            'error': str(error)
        }
    except Exception as e:
        print(f"❌ Error creating meeting: {e}")
        return {
            'meet_link': '',
            'event_id': '',
            'calendar_link': '',
            'status': 'failed',
            'error': str(e)
        }


def update_vi_meeting(event_id, new_time=None, new_duration=None):
    """
    Update existing Google Meet meeting
    
    Args:
        event_id (str): Google Calendar event ID
        new_time (datetime): New meeting start time (optional)
        new_duration (int): New duration in minutes (optional)
    
    Returns:
        dict: Updated meeting details
    """
    try:
        service = get_calendar_service()
        
        # Get existing event
        event = service.events().get(calendarId='primary', eventId=event_id).execute()
        
        # Update time if provided
        if new_time:
            duration = new_duration or 60
            end_time = new_time + timedelta(minutes=duration)
            
            event['start'] = {
                'dateTime': new_time.isoformat(),
                'timeZone': 'Asia/Kolkata',
            }
            event['end'] = {
                'dateTime': end_time.isoformat(),
                'timeZone': 'Asia/Kolkata',
            }
        
        # Update event
        updated_event = service.events().update(
            calendarId='primary',
            eventId=event_id,
            body=event,
            sendUpdates='all'
        ).execute()
        
        print(f"✅ Meeting updated successfully: {event_id}")
        
        return {
            'meet_link': updated_event.get('hangoutLink', ''),
            'event_id': updated_event.get('id', ''),
            'calendar_link': updated_event.get('htmlLink', ''),
            'status': 'updated'
        }
        
    except Exception as e:
        print(f"❌ Error updating meeting: {e}")
        return {'status': 'failed', 'error': str(e)}


def cancel_vi_meeting(event_id):
    """
    Cancel Google Meet meeting
    
    Args:
        event_id (str): Google Calendar event ID
    
    Returns:
        dict: Cancellation status
    """
    try:
        service = get_calendar_service()
        
        service.events().delete(
            calendarId='primary',
            eventId=event_id,
            sendUpdates='all'
        ).execute()
        
        print(f"✅ Meeting cancelled successfully: {event_id}")
        
        return {'status': 'cancelled'}
        
    except Exception as e:
        print(f"❌ Error cancelling meeting: {e}")
        return {'status': 'failed', 'error': str(e)}


def get_meeting_details(event_id):
    """
    Get details of existing meeting
    
    Args:
        event_id (str): Google Calendar event ID
    
    Returns:
        dict: Meeting details
    """
    try:
        service = get_calendar_service()
        
        event = service.events().get(calendarId='primary', eventId=event_id).execute()
        
        return {
            'meet_link': event.get('hangoutLink', ''),
            'event_id': event.get('id', ''),
            'calendar_link': event.get('htmlLink', ''),
            'start_time': event['start'].get('dateTime', ''),
            'end_time': event['end'].get('dateTime', ''),
            'status': event.get('status', ''),
            'attendees': event.get('attendees', [])
        }
        
    except Exception as e:
        print(f"❌ Error getting meeting details: {e}")
        return {'status': 'failed', 'error': str(e)}
