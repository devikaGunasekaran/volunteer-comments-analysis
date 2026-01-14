import google.generativeai as genai
import requests
import re
import json
import os
import time

# Agent 1: Translation (Groq) - uses default 0.3
# Agent 3: Master Analysis (Groq) - uses 0.1

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
model_gemini = genai.GenerativeModel(
    "gemini-2.5-flash",
    generation_config={
        "temperature": 0.3,  # Low temperature for consistent, fair analysis
        "top_p": 0.95,       # Nucleus sampling for quality
        "top_k": 40,         # Limit token choices for consistency
        "max_output_tokens": 2048,  # Sufficient for detailed responses
    }
)

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
    You are an objective image quality analyzer. Analyze this image for TECHNICAL QUALITY ONLY.
    Return JSON ONLY: {"status": "GOOD" | "BAD", "reason": "specific technical issue"}
    
    CRITICAL: Focus ONLY on technical image quality, NOT on what the image shows.
    
    Mark as BAD if ANY of these TECHNICAL issues exist:
    1. FOCUS ISSUES:
       - Image is blurry or out of focus
       - Motion blur present
       - Depth of field issues making subject unclear
    
    2. EXPOSURE ISSUES:
       - Too dark (underexposed) - cannot see details
       - Too bright (overexposed) - details washed out
       - Extreme contrast making details invisible
    
    3. CORRUPTION ISSUES:
       - Completely black or blank image
       - File corruption or artifacts
       - Partial image loading
       - Pixelated beyond recognition
    
    4. VISIBILITY ISSUES:
       - Main subject (building/structure) is NOT visible at all
       - Image is completely obscured (e.g., finger over lens)
       - Wrong subject (e.g., selfie, random object, not a building)
    
    Mark as GOOD if:
    - Image is reasonably sharp and in focus
    - Main subject (building/structure) is visible
    - Adequate lighting to see details
    - No major corruption or technical defects
    
    IMPORTANT GUIDELINES:
    - DO NOT judge based on house condition (poor, rich, etc.)
    - DO NOT judge based on house type (hut, mansion, apartment, etc.)
    - DO NOT judge based on surroundings or neighborhood
    - DO NOT judge based on cleanliness or aesthetics
    - ONLY judge technical image quality and visibility
    
    Be OBJECTIVE and FAIR. When in doubt about technical quality, mark as BAD.
    When in doubt about house condition/type, mark as GOOD (not your job to judge).
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


# ==========================================
# AGENT 6: IMAGE ENHANCEMENT AGENT
# ==========================================
# Technology: OpenCV (local) + Gemini (validation)
# Purpose: Enhance poor-quality images for better analysis

import cv2
import numpy as np

def agent_image_enhancement(image_bytes):
    """
    Agent 6: Image Enhancement Agent
    Enhances poor-quality images using OpenCV
    Then validates with Gemini (Agent 4)
    """
    print("🔧 Agent 6: Image Enhancement Agent activated")
    
    try:
        # Step 1: OpenCV Enhancement
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image")
        
        # Denoise
        denoised = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
        
        # Enhance details
        enhanced = cv2.detailEnhance(denoised, sigma_s=10, sigma_r=0.15)
        
        # Auto-adjust brightness & contrast (CLAHE)
        lab = cv2.cvtColor(enhanced, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        # Sharpen
        kernel = np.array([[-1,-1,-1], [-1, 9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)
        
        # Convert back to bytes
        _, buffer = cv2.imencode('.jpg', sharpened, [cv2.IMWRITE_JPEG_QUALITY, 95])
        enhanced_bytes = buffer.tobytes()
        
        # Step 2: Validate with Agent 4 (Quality Check)
        print("   ↳ Validating enhanced image with Agent 4...")
        quality_result = ai_quality_check(enhanced_bytes)
        
        print(f"   ✓ Enhancement complete. Quality: {quality_result['status']}")
        
        return {
            "success": True,
            "enhanced_image": enhanced_bytes,
            "quality_status": quality_result["status"],
            "quality_reason": quality_result.get("reason", ""),
            "agent": "Agent 6: Image Enhancement"
        }
        
    except Exception as e:
        print(f"   ✗ Agent 6 Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "agent": "Agent 6: Image Enhancement"
        }


# ==========================================
# AGENT 7: HANDWRITING OCR AGENT (Tanglish)
# ==========================================
# Technology: Gemini 2.5 Flash ONLY
# Purpose: Extract text from handwritten Tanglish documents

def agent_handwriting_ocr(image_bytes):
    """
    Agent 7: Handwriting OCR Agent (Gemini Only)
    Extracts text from handwritten images (optimized for Tanglish)
    """
    print("📝 Agent 7: Handwriting OCR Agent activated (Gemini)")
    
    prompt = """Extract ALL handwritten text from this image.
    
    IMPORTANT: This may contain TANGLISH (Tamil + English mixed).
    - Preserve EXACT original language for each word
    - Maintain Tamil script (தமிழ்) where present
    - Maintain English/Latin script where present
    - Handle transliteration (e.g., "naan" for நான்)
    - Preserve line breaks and structure
    - Mark unclear text with [?]
    
    Return ONLY extracted text, no explanations."""
    
    try:
        response = retry_gemini_call(model_gemini.generate_content, [
            prompt,
            {"mime_type": "image/jpeg", "data": image_bytes}
        ])
        
        text = response.text.strip()
        lang_info = _analyze_language_composition(text)
        
        print(f"   ✓ OCR successful. Language: {lang_info['primary']}")
        print(f"   ✓ Composition: {lang_info['composition']}")
        
        return {
            "success": True,
            "text": text,
            "confidence": 0.97,
            "method": "Gemini Vision",
            "language": lang_info["primary"],
            "composition": lang_info["composition"],
            "agent": "Agent 7: Handwriting OCR"
        }
        
    except Exception as e:
        print(f"   ✗ Agent 7 Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "agent": "Agent 7: Handwriting OCR"
        }


def _analyze_language_composition(text):
    """Helper: Analyze Tamil/English composition"""
    tamil_chars = len(re.findall(r'[\u0B80-\u0BFF]', text))
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    total = tamil_chars + english_chars
    
    if total == 0:
        return {"primary": "unknown", "composition": "No text detected"}
    
    tamil_pct = (tamil_chars / total) * 100
    english_pct = (english_chars / total) * 100
    
    if tamil_pct > 60:
        primary = "tamil"
    elif english_pct > 60:
        primary = "english"
    else:
        primary = "tanglish"
    
    return {
        "primary": primary,
        "composition": f"{tamil_pct:.0f}% Tamil, {english_pct:.0f}% English",
        "tamil_percentage": tamil_pct,
        "english_percentage": english_pct
    }
