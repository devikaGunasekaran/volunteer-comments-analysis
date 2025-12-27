from backend.services.pv_graph import pv_graph

def pv_process(text_comment, audio_path, image_paths=None, is_tanglish=False):
    state = {
        "text_comment": text_comment or "",
        "audio_path": audio_path or "",
        "image_paths": image_paths or [],
        "is_tanglish": is_tanglish,
    }

    result = pv_graph.invoke(state)

    # Map graph output → what app.py expect
    return {
        "english_comment": result.get("english_from_tanglish", ""),
        "voice_text": result.get("english_from_audio", ""),
        "summary": result.get("summary", []),
        "decision": result.get("decision", ""),
        "score": result.get("score", 0.0),
        "house_analysis": result.get("house_analysis_points", [])
    }