"""
RAG Service for Sentiment Analysis
Uses ChromaDB for local vector storage and Gemini for embeddings
"""

import os
import json
import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from typing import List, Dict, Optional
import time

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ==========================================
# CONFIGURATION
# ==========================================
CHROMA_DB_PATH = os.environ.get("CHROMA_DB_PATH", "./chroma_db")
RAG_COLLECTION_NAME = os.environ.get("RAG_COLLECTION_NAME", "student_cases")
RAG_TOP_K = int(os.environ.get("RAG_TOP_K", "5"))
RAG_ENABLED = os.environ.get("RAG_ENABLED", "true").lower() == "true"

# Configure Gemini for embeddings
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# ==========================================
# CHROMADB CLIENT INITIALIZATION
# ==========================================
_chroma_client = None
_collection = None

def initialize_rag():
    """
    Initialize ChromaDB client and collection.
    Creates the collection if it doesn't exist.
    """
    global _chroma_client, _collection
    
    if not RAG_ENABLED:
        print("⚠️ RAG is disabled via RAG_ENABLED=false")
        return None
    
    try:
        # Create ChromaDB client with persistent storage
        _chroma_client = chromadb.PersistentClient(
            path=CHROMA_DB_PATH,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Get or create collection
        _collection = _chroma_client.get_or_create_collection(
            name=RAG_COLLECTION_NAME,
            metadata={"description": "Verified student cases for RAG"}
        )
        
        print(f"✅ RAG initialized: {_collection.count()} documents in collection")
        return _collection
        
    except Exception as e:
        print(f"❌ Failed to initialize RAG: {e}")
        return None

def get_collection():
    """Get the ChromaDB collection, initializing if needed."""
    global _collection
    if _collection is None:
        initialize_rag()
    return _collection

# ==========================================
# EMBEDDING GENERATION
# ==========================================
def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding using Gemini's embedding model.
    Falls back to simple hash if API fails.
    """
    try:
        # Use Gemini's text embedding model
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
        
    except Exception as e:
        print(f"⚠️ Embedding generation failed: {e}")
        # Fallback: return None to let ChromaDB handle it
        raise e

# ==========================================
# DOCUMENT STORAGE
# ==========================================
def add_student_case(
    student_id: str,
    district: str,
    decision: str,
    score: float,
    comments: str,
    summary: str,
    voice_comments: str = "",
    house_analysis: str = "",
    verification_date: str = "",
    embedding: Optional[List[float]] = None,
    ai_decision: str = "",  # NEW: AI/Volunteer recommendation (SELECT/REJECT/ON HOLD)
    admin_decision: str = "",  # NEW: Admin final decision (APPROVED/REJECTED)
    admin_remarks: str = ""  # NEW: Admin remarks stored separately
):
    """
    Add a verified student case to the RAG knowledge base.
    
    Args:
        student_id: Unique student identifier
        district: Student's district
        decision: Final decision (for backward compatibility, usually admin_decision)
        score: Sentiment score (0-100)
        comments: Volunteer's text comments
        summary: AI-generated summary
        voice_comments: Transcribed voice comments
        house_analysis: House condition analysis
        verification_date: Date of verification
        embedding: Optional pre-generated embedding
        ai_decision: AI/Volunteer recommendation (SELECT/REJECT/ON HOLD)
        admin_decision: Admin final decision (APPROVED/REJECTED)
        admin_remarks: Admin's remarks/observations
    """
    if not RAG_ENABLED:
        return
    
    collection = get_collection()
    if collection is None:
        return
    
    try:
        # Combine all text for embedding
        combined_text = f"""
        District: {district}
        AI Decision: {ai_decision}
        Admin Decision: {admin_decision}
        Score: {score}
        
        Comments: {comments}
        Voice: {voice_comments}
        Summary: {summary}
        House Analysis: {house_analysis}
        Admin Remarks: {admin_remarks}
        """.strip()
        
        # Use provided embedding or generate new one
        if embedding is not None:
            # Reuse embedding from RAG search (saves 1 API call!)
            case_embedding = embedding
            print("♻️ Reusing embedding from RAG search")
        else:
            # Generate new embedding (fallback)
            case_embedding = generate_embedding(combined_text)
            print("🔄 Generated new embedding")
        
        # Prepare metadata with separate decision fields
        metadata = {
            "student_id": student_id,
            "district": district,
            "decision": decision,  # Final decision (for backward compatibility)
            "ai_decision": ai_decision,  # AI/Volunteer recommendation
            "admin_decision": admin_decision,  # Admin final decision
            "score": float(score),
            "verification_date": verification_date or "",
            "has_admin_remarks": bool(admin_remarks),  # Flag for filtering
        }
        
        # Add to ChromaDB
        collection.add(
            ids=[f"student_{student_id}_{int(time.time())}"],
            embeddings=[case_embedding],  # Use the reused or newly generated embedding
            documents=[combined_text],
            metadatas=[metadata]
        )
        
        print(f"✅ Added student case to RAG: {student_id} (AI: {ai_decision}, Admin: {admin_decision})")
        
    except Exception as e:
        print(f"❌ Failed to add student case to RAG: {e}")

# ==========================================
# SIMILARITY SEARCH
# ==========================================
def search_similar_cases(
    query_text: str,
    district: Optional[str] = None,
    top_k: Optional[int] = None
) -> List[Dict]:
    """
    Search for similar student cases based on query text.
    
    Args:
        query_text: Text to search for (volunteer comments, summary, etc.)
        district: Optional filter by district
        top_k: Number of results to return (default: RAG_TOP_K)
    
    Returns:
        List of similar cases with metadata and similarity scores
    """
    if not RAG_ENABLED:
        return []
    
    collection = get_collection()
    if collection is None or collection.count() == 0:
        print("⚠️ RAG collection is empty")
        return []
    
    try:
        # Generate query embedding
        query_embedding = generate_embedding(query_text)
        
        # Prepare filters
        where_filter = None
        if district:
            where_filter = {"district": district}
        
        # Search
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k or RAG_TOP_K,
            where=where_filter
        )
        
        # Format results
        similar_cases = []
        if results['documents'] and len(results['documents'][0]) > 0:
            for i in range(len(results['documents'][0])):
                similar_cases.append({
                    'document': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'distance': results['distances'][0][i] if 'distances' in results else None
                })
        
        print(f"🔍 Found {len(similar_cases)} similar cases")
        return similar_cases
        
    except Exception as e:
        print(f"❌ RAG search failed: {e}")
        return []

def search_similar_cases_with_embedding(
    query_text: str,
    district: Optional[str] = None,
    top_k: Optional[int] = None
) -> tuple[List[Dict], List[float]]:
    """
    Search for similar cases AND return the query embedding for reuse.
    This saves one API call by reusing the embedding for storage.
    
    Args:
        query_text: Text to search for
        district: Optional filter by district
        top_k: Number of results to return
    
    Returns:
        Tuple of (similar_cases, query_embedding)
    """
    if not RAG_ENABLED:
        return [], None
    
    collection = get_collection()
    if collection is None or collection.count() == 0:
        print("⚠️ RAG collection is empty")
        return [], None
    
    try:
        # Generate query embedding (ONLY ONCE)
        query_embedding = generate_embedding(query_text)
        
        # Prepare filters
        where_filter = None
        if district:
            where_filter = {"district": district}
        
        # Search using the same embedding
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k or RAG_TOP_K,
            where=where_filter
        )
        
        # Format results
        similar_cases = []
        if results['documents'] and len(results['documents'][0]) > 0:
            for i in range(len(results['documents'][0])):
                similar_cases.append({
                    'document': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'distance': results['distances'][0][i] if 'distances' in results else None
                })
        
        print(f"🔍 Found {len(similar_cases)} similar cases")
        
        # Return both results AND the embedding for reuse
        return similar_cases, query_embedding
        
    except Exception as e:
        print(f"❌ RAG search failed: {e}")
        return [], None

# ==========================================
# CONTEXT FORMATTING
# ==========================================
def format_rag_context(similar_cases: List[Dict]) -> str:
    """
    Format retrieved cases into a readable context for the LLM.
    
    Args:
        similar_cases: List of similar cases from search_similar_cases()
    
    Returns:
        Formatted string for LLM consumption
    """
    if not similar_cases:
        return "No similar historical cases found."
    
    context_parts = ["HISTORICAL CONTEXT - Similar Verified Cases:\n"]
    
    for i, case in enumerate(similar_cases, 1):
        metadata = case['metadata']
        doc = case['document']
        
        # Extract key info
        decision = metadata.get('decision', 'UNKNOWN')
        score = metadata.get('score', 0)
        district = metadata.get('district', 'Unknown')
        
        context_parts.append(f"""
Case {i}:
- District: {district}
- Decision: {decision}
- Score: {score}
- Details: {doc[:300]}...
""")
    
    return "\n".join(context_parts)

# ==========================================
# UTILITY FUNCTIONS
# ==========================================
def get_collection_stats() -> Dict:
    """Get statistics about the RAG collection."""
    if not RAG_ENABLED:
        return {"enabled": False}
    
    collection = get_collection()
    if collection is None:
        return {"enabled": True, "initialized": False}
    
    return {
        "enabled": True,
        "initialized": True,
        "document_count": collection.count(),
        "collection_name": RAG_COLLECTION_NAME,
        "db_path": CHROMA_DB_PATH
    }

def reset_collection():
    """Reset the RAG collection (use with caution!)"""
    global _chroma_client, _collection
    
    if _chroma_client and _collection:
        _chroma_client.delete_collection(RAG_COLLECTION_NAME)
        print(f"⚠️ Deleted collection: {RAG_COLLECTION_NAME}")
        _collection = None
        initialize_rag()

# ==========================================
# MAIN (for testing)
# ==========================================
if __name__ == "__main__":
    print("Testing RAG Service...")
    
    # Initialize
    initialize_rag()
    
    # Get stats
    stats = get_collection_stats()
    print(f"\nCollection Stats: {json.dumps(stats, indent=2)}")
    
    # Test embedding
    test_text = "Poor family living in small house with limited resources"
    try:
        embedding = generate_embedding(test_text)
        print(f"\n✅ Embedding generated: {len(embedding)} dimensions")
    except Exception as e:
        print(f"\n❌ Embedding failed: {e}")
