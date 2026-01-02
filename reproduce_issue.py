
import urllib.request
import urllib.parse
import json
import http.cookiejar

BASE_URL = "http://localhost:5000"

# Setup cookie jar
cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

def login():
    url = f"{BASE_URL}/api/login"
    payload = {
        "volunteerId": "V002",
        "password": "priya@123"
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with opener.open(req) as response:
            print("Login Status:", response.getcode())
            print("Login Response:", response.read().decode())
            return True
    except urllib.error.HTTPError as e:
        print("Login Failed:", e.code, e.read().decode())
        return False
    except Exception as e:
        print("Login Error:", str(e))
        return False

def submit_tv(studentId):
    url = f"{BASE_URL}/api/tv-volunteer/submit"
    payload = {
        "studentId": studentId,
        "volunteerId": "V002",
        "status": "VERIFIED",
        "comments": "Automated Testing Verification via Urllib"
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with opener.open(req) as response:
            print("Submit Status:", response.getcode())
            print("Submit Response:", response.read().decode())
    except urllib.error.HTTPError as e:
        print("Submit Failed:", e.code, e.read().decode())
        if e.code == 401:
            print("Unauthorized - Session cookie might be missing or invalid")
    except Exception as e:
        print("Submit Error:", str(e))

if __name__ == "__main__":
    if login():
        # Try submitting for 2025-015
        submit_tv("2025-015")
