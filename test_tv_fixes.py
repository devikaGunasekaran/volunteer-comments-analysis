
import requests

BASE_URL = "http://localhost:5000"
# Mocking a session would be hard without a real login, 
# but we can try to check if the routes return 401 (Unauthorized) 
# instead of 404 or other errors, and then check the code logic.

def test_api_student_details():
    print("Testing /api/student/<id>...")
    # This should return 401 if not logged in, but we want to see if it's reachable
    resp = requests.get(f"{BASE_URL}/api/student/2025-001")
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text[:100]}")

def test_tv_assigned_students():
    print("\nTesting /api/tv-volunteer/assigned-students...")
    resp = requests.get(f"{BASE_URL}/api/tv-volunteer/assigned-students")
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text[:100]}")

if __name__ == "__main__":
    try:
        test_api_student_details()
        test_tv_assigned_students()
    except Exception as e:
        print(f"Error: {e}")
