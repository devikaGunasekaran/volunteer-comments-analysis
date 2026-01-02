
import urllib.request
import urllib.parse
import json
import http.cookiejar

BASE_URL = "http://localhost:5000"

# Setup cookie jar
cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

def login_admin():
    url = f"{BASE_URL}/api/login"
    payload = {
        "volunteerId": "V001",
        "password": "arun@123"
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

def check_reports():
    url = f"{BASE_URL}/admin/api/submitted-tv-reports"
    req = urllib.request.Request(url)
    
    try:
        with opener.open(req) as response:
            print("\n--- Check Reports ---")
            print("Status:", response.getcode())
            data = response.read().decode()
            print("Response:", data)
            json_data = json.loads(data)
            print(f"Count: {len(json_data.get('reports', []))}")
    except urllib.error.HTTPError as e:
        print("Check Reports Failed:", e.code, e.read().decode())
    except Exception as e:
        print("Check Reports Error:", str(e))

if __name__ == "__main__":
    if login_admin():
        check_reports()
