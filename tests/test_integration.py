"""
Integration tests for EcoSynk AI Services
Tests the complete workflow end-to-end
"""

import sys
from pathlib import Path

import pytest

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
        pytest.fail(f"Initialization failed: {e}")
    
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
        assert embedding, "Embedding generator returned empty output"
        print(f"✅ Embedding generated: {len(embedding)} dimensions")
    except Exception as e:
        pytest.fail(f"Embedding failed: {e}")
    
    # Step 4: Store in Qdrant
    print("\n[4/5] Storing in Qdrant...")
    try:
        report_id = vector_store.store_trash_report(
            embedding=embedding,
            metadata=mock_report
        )
        assert report_id, "Vector store did not return a report ID"
        print(f"✅ Stored with ID: {report_id}")
    except Exception as e:
        pytest.fail(f"Storage failed: {e}")
    
    # Step 5: Search for similar reports
    print("\n[5/5] Searching for similar reports...")
    try:
        similar = vector_store.find_similar_reports(
            embedding=embedding,
            limit=5
        )
        assert isinstance(similar, list), "Vector store did not return a list"
        print(f"✅ Found {len(similar)} similar reports")
    except Exception as e:
        pytest.fail(f"Search failed: {e}")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        test_complete_workflow()
    except Exception as exc:  # pytest.fail raises a Failed exception that subclasses Exception
        print(f"❌ Workflow test failed: {exc}")
        sys.exit(1)
    sys.exit(0)

