# pv_graph.py
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional


class PVState(TypedDict, total=False):
    text_comment: str
    audio_path: Optional[str]
    is_tanglish: bool
    image_paths: list  # New field for images

    english_from_tanglish: str
    english_from_audio: str
    merged_text: str
    
    # RAG fields
    rag_context: str  # Formatted context from similar cases
    similar_cases: list  # Raw similar cases data
    query_embedding: list  # Reusable embedding for search and storage

    summary: list
    decision: str
    reason: str
    score: float
    
    house_analysis_points: dict # Output of image analysis (was list, now keys 'points' and 'condition')


# --------------------- NODES ----------------------
def node_house_analysis(state: PVState):
    from backend.services.ai_service import ai_house_analysis
    
    paths = state.get("image_paths", [])
    if not paths:
        return {"house_analysis_points": ["No images available"]}
        
    points_dict = ai_house_analysis(paths)
    return {"house_analysis_points": points_dict}

def node_tanglish_to_english(state: PVState):
    from backend.services.ai_service import tanglish_to_english
    
    text = state.get("text_comment", "")

    # If no text provided, return "no text"
    if not text or text.strip() == "":
        return {"english_from_tanglish": "no text"}

    # Otherwise process normally
    result = tanglish_to_english(text)
    return {"english_from_tanglish": result}


def node_audio_to_english(state: PVState):
    from backend.services.ai_service import audio_to_english

    audio_path = state.get("audio_path")
    if not audio_path:
        print("⚠️ No audio provided — skipping audio node")
        return {"english_from_audio": ""}

    result = audio_to_english(audio_path)
    return {"english_from_audio": result}


def node_merge(state: PVState):
    from backend.services.ai_service import deduplicate_and_label

    merged = deduplicate_and_label(
        state.get("english_from_tanglish", ""),
        state.get("english_from_audio", "")
    )

    return {"merged_text": merged}


def node_rag_retrieval(state: PVState):
    """Retrieve similar cases from RAG knowledge base."""
    try:
        from backend.services.rag_service import search_similar_cases_with_embedding, format_rag_context, RAG_ENABLED
        
        if not RAG_ENABLED:
            print("⚠️ RAG is disabled")
            return {"rag_context": "", "similar_cases": [], "query_embedding": None}
        
        merged_text = state.get("merged_text", "")
        
        # Search for similar cases (generates embedding internally and returns it)
        similar_cases, query_embedding = search_similar_cases_with_embedding(merged_text, top_k=5)
        
        # Format context for LLM
        rag_context = format_rag_context(similar_cases)
        
        return {
            "rag_context": rag_context,
            "similar_cases": similar_cases,
            "query_embedding": query_embedding  # Pass embedding for reuse in storage
        }
        
    except Exception as e:
        print(f"⚠️ RAG retrieval failed: {e}")
        return {"rag_context": "", "similar_cases": [], "query_embedding": None}


def node_master_analysis(state: PVState):
    from backend.services.ai_service import generate_combined_analysis
    
    # Pass RAG context to analysis
    rag_context = state.get("rag_context", "")
    analysis = generate_combined_analysis(
        state.get("merged_text", ""),
        rag_context=rag_context
    )
    
    return {
        "summary": analysis.get("summary", []),
        "decision": analysis.get("decision", "ON HOLD"),
        "score": analysis.get("score", 0.0)
    }

# --------------------- BUILD GRAPH ----------------------

builder = StateGraph(PVState)

builder.add_node("Tanglish", node_tanglish_to_english)
builder.add_node("Audio", node_audio_to_english)
builder.add_node("Merge", node_merge)
builder.add_node("RAGRetrieval", node_rag_retrieval)  # NEW: RAG node
builder.add_node("MasterAnalysis", node_master_analysis)
builder.add_node("HouseAnalysis", node_house_analysis)

builder.set_entry_point("Tanglish")

# Updated flow: Tanglish → Audio → Merge → RAG → MasterAnalysis → HouseAnalysis → END
builder.add_edge("Tanglish", "Audio")
builder.add_edge("Audio", "Merge")
builder.add_edge("Merge", "RAGRetrieval")  # NEW: Add RAG after merge
builder.add_edge("RAGRetrieval", "MasterAnalysis")  # NEW: RAG before analysis
builder.add_edge("MasterAnalysis", "HouseAnalysis")
builder.add_edge("HouseAnalysis", END)

pv_graph = builder.compile()
