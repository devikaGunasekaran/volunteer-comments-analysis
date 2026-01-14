"""
Test Gemini API Key
Run this to verify your API key works
"""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get API key
api_key = os.getenv('GEMINI_API_KEY')

print("=" * 50)
print("GEMINI API KEY TEST")
print("=" * 50)

if not api_key:
    print("❌ ERROR: GEMINI_API_KEY not found in environment!")
    print("\nCheck your .env file:")
    print("  - File exists: .env")
    print("  - Contains: GEMINI_API_KEY=\"your_key_here\"")
    exit(1)

print(f"✅ API Key found: {api_key[:20]}...{api_key[-10:]}")
print("\nTesting API connection...")

try:
    import google.generativeai as genai
    
    # Configure Gemini
    genai.configure(api_key=api_key)
    
    # Test with gemini-2.5-flash (same as your app)
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content("Say 'Hello, API is working!'")
    
    print("\n✅ SUCCESS! API is working!")
    print(f"Response: {response.text}")
    print("\n" + "=" * 50)
    print("Your Gemini API key is valid and working!")
    print("=" * 50)
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print("\nPossible issues:")
    print("  1. API key is invalid")
    print("  2. Quota exceeded (wait 60 seconds)")
    print("  3. API key doesn't have Gemini access")
    print("\nSolution:")
    print("  - Get new API key from: https://aistudio.google.com/app/apikey")
    print("  - Wait 60 seconds if quota exceeded")
    print("  - Update .env file with new key")
