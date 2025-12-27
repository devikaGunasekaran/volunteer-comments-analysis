import google.generativeai as genai
import requests
import re
import json
import os
import time

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ==========================================
# 1. CONFIGURATION (HYBRID AI)
# ==========================================
# Gemini: For Audio & Images (Multimodal)
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model_gemini = genai.GenerativeModel("gemini-2.5-flash")

# Groq: For Text Logic (Speed & Text-only)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"  # Fast, smart, free tier available

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================

def retry_gemini_call(func, *args, **kwargs):
    """Retries Gemini API calls with exponential backoff."""
    max_retries = 3
    delay = 2
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            msg = str(e).lower()
            if "exhausted" in msg or "429" in msg or "quota" in msg:
                print(f"⚠️ Gemini Quota Hit. Retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2
            else:
                print(f"❌ Gemini Error: {e}")
                raise e
    raise Exception("Max retries exceeded for Gemini API")

def call_groq_api(system_prompt, user_prompt, temperature=0.3):
    """Calls Groq API for fast text processing."""
    if not GROQ_API_KEY:
        print("⚠️ GROQ_API_KEY missing. Falling back to Gemini for text task.")
        # Fallback to Gemini if Groq key is missing
        prompt = f"{system_prompt}\n\nTask: {user_prompt}"
        return retry_gemini_call(model_gemini.generate_content, prompt).text

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": temperature,
        "response_format": {"type": "json_object"} if "json" in system_prompt.lower() else None
    }

    try:
        response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
    except Exception as e:
        print(f"❌ Groq API Error: {e}. Falling back to Gemini.")
        # Fallback to Gemini on Groq failure
        prompt = f"{system_prompt}\n\nTask: {user_prompt}"
        return retry_gemini_call(model_gemini.generate_content, prompt).text


# ==========================================
# 3. AI SERVICES
# ==========================================

# [GEMINI] AUDIO → ENGLISH
def audio_to_english(audio_path):
    if not audio_path:
        raise ValueError("audio_path is missing")
    
    print(f"🎤 Transcribing Audio via Gemini: {audio_path}")
    uploaded = genai.upload_file(audio_path)
    
    response = retry_gemini_call(model_gemini.generate_content, [
        uploaded,
        "Transcribe usage of this audio and translate it to clear English text."
    ])
    return (response.text or "").strip()


# [GROQ] TANGLISH → ENGLISH
def tanglish_to_english(text):
    if not text: return ""
    
    sys = "You are a translator. Convert Tanglish (Tamil+English mix) to professional English."
    user = f"Convert this text:\n{text}"
    
    return call_groq_api(sys, user).strip()


# [PYTHON] MERGE TEXTS
def deduplicate_and_label(text_comment, audio_text):
    t1 = set([s.strip() for s in (text_comment or "").split(".") if s.strip()])
    t2 = set([s.strip() for s in (audio_text or "").split(".") if s.strip()])
    
    return (
        f"Text Comment:\n{'. '.join(t1)}\n\n"
        f"Audio Transcript:\n{'. '.join(t2)}"
    )

# [GROQ] COMBINED ANALYSIS (Summary + Decision + Score)
def generate_combined_analysis(combined_text, rag_context=""):
    sys = """You are an expert student verification officer.
    Output ONLY valid JSON.
    Structure:
    {
        "summary": ["point 1", "point 2", "point 3", "point 4", "point 5"],
        "decision": "SELECT" | "DO NOT SELECT" | "ON HOLD",
        "score": 85.0
    }
    Rules:
    - Summary: Exactly 5 factual bullet points. **Use very simple, easy-to-read English.**
    - SELECT: If student is poor/needy.
    - DO NOT SELECT: If financially stable.
    - Score: 1-100 confidence."""

    # Build user prompt with optional RAG context
    user_parts = []
    
    if rag_context and rag_context.strip():
        user_parts.append(f"{rag_context}\n")
        user_parts.append("---\n")
        user_parts.append("Use the historical context above to inform your decision, but prioritize the current case details below.\n\n")
    
    user_parts.append(f"CURRENT CASE:\n{combined_text}")
    user = "".join(user_parts)

    raw = call_groq_api(sys, user, temperature=0.1)

    # Clean & Parse JSON
    try:
        # Find JSON block if Groq adds extra text
        match = re.search(r"\{[\s\S]*?\}", raw)
        json_str = match.group() if match else raw
        return json.loads(json_str)
    except Exception as e:
        print("⚠️ AI JSON Parse Error:", e)
        return {
            "summary": ["Error parsing AI analysis."],
            "decision": "ON HOLD",
            "score": 0.0
        }

# [GEMINI] IMAGE QUALITY CHECK
def ai_quality_check(image_bytes):
    prompt = """
    Return JSON ONLY: {"status": "GOOD" | "BAD", "reason": "why"}
    Good = House visible. Bad = Black/Blank/Corrupt.
    """
    
    response = retry_gemini_call(model_gemini.generate_content, [
        prompt,
        {"mime_type": "image/jpeg", "data": image_bytes}
    ])
    
    try:
        raw = response.text or "{}"
        match = re.search(r"\{[\s\S]*?\}", raw)
        return json.loads(match.group()) if match else {"status":"BAD", "reason":"Parse Error"}
    except:
        return {"status": "BAD", "reason": "AI Error"}

# [GEMINI] COLLECTIVE HOUSE ANALYSIS
def ai_house_analysis(image_paths):
    if not image_paths: return ["No images."]
    
    print(f"🏠 Analyzing {len(image_paths)} images via Gemini...")
    
    prompt = """
    Analyze these images of a student's house.
    Return JSON ONLY with this structure:
    {
        "points": ["point 1", "point 2", "point 3", "point 4", "point 5"],
        "condition": "POOR" | "MODERATE" | "GOOD"
    }
    Rules:
    - Points: 5 factual observations in simple English.
    - Condition: "POOR" if needy, "GOOD" if wealthy.
    """
    
    content = [prompt]
    for p in image_paths:
        try:
            content.append(genai.upload_file(p))
        except Exception as e:
            print(f"⚠️ Skip img {p}: {e}")
            
    response = retry_gemini_call(model_gemini.generate_content, content)
    
    # Parse JSON
    try:
        raw = response.text or "{}"
        match = re.search(r"\{[\s\S]*?\}", raw)
        data = json.loads(match.group()) if match else {}
        return {
            "points": data.get("points", ["Analysis failed"]),
            "condition": data.get("condition", "UNKNOWN")
        }
    except:
        return {"points": ["Error parsing house analysis"], "condition": "UNKNOWN"}
