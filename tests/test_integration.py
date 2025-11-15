"""
Integration tests for EcoSynk AI Services
Tests the complete workflow end-to-end
"""

import sys
from pathlib import Path

# Add ai-services directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'ai-services'))

from config import settings
from gemini.trash_analyzer import TrashAnalyzer
from qdrant.vector_store import EcoSynkVectorStore
from embeddings.generator import EmbeddingGenerator


def test_complete_workflow():
    """Test the complete trash analysis workflow"""
    
    print("\n" + "=" * 60)
    print("🧪 Testing Complete Workflow")
    print("=" * 60)
    
    # Step 1: Initialize services
    print("\n[1/5] Initializing services...")
    try:
        embedder = EmbeddingGenerator()
        vector_store = EcoSynkVectorStore()
        vector_store.setup_collections(recreate=False)
        analyzer = TrashAnalyzer()
        print("✅ All services initialized")
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        return False
    
    # Step 2: Create mock trash report
    print("\n[2/5] Creating mock trash report...")
    mock_report = {
        "primary_material": "plastic",
        "estimated_volume": "large",
        "specific_items": ["water bottles", "plastic bags"],
        "description": "Large pile of plastic waste",
        "cleanup_priority_score": 8,
        "environmental_risk_level": "high",
        "recommended_equipment": ["gloves", "bags"]
    }
    print("✅ Mock report created")
    
    # Step 3: Generate embedding
    print("\n[3/5] Generating embedding...")
    try:
        embedding = embedder.generate_trash_report_embedding(mock_report)
        print(f"✅ Embedding generated: {len(embedding)} dimensions")
    except Exception as e:
        print(f"❌ Embedding failed: {e}")
        return False
    
    # Step 4: Store in Qdrant
    print("\n[4/5] Storing in Qdrant...")
    try:
        report_id = vector_store.store_trash_report(
            embedding=embedding,
            metadata=mock_report
        )
        print(f"✅ Stored with ID: {report_id}")
    except Exception as e:
        print(f"❌ Storage failed: {e}")
        return False
    
    # Step 5: Search for similar reports
    print("\n[5/5] Searching for similar reports...")
    try:
        similar = vector_store.find_similar_reports(
            embedding=embedding,
            limit=5
        )
        print(f"✅ Found {len(similar)} similar reports")
    except Exception as e:
        print(f"❌ Search failed: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = test_complete_workflow()
    sys.exit(0 if success else 1)

