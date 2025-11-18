#!/usr/bin/env python3
"""
Pre-download sentence-transformers model during build phase
This prevents timeout issues during server startup
"""

print("\n" + "=" * 60)
print("📦 Pre-downloading sentence-transformers model...")
print("=" * 60)

try:
    from sentence_transformers import SentenceTransformer
    
    # Download and cache the model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("✅ Model downloaded and cached successfully!")
    print(f"📊 Model dimension: {model.get_sentence_embedding_dimension()}")
    print("=" * 60 + "\n")
    
except Exception as e:
    print(f"❌ Failed to download model: {e}")
    print("⚠️  Server will still start, but embedding features may be slow on first use")
    print("=" * 60 + "\n")
    # Don't fail the build if model download fails
    exit(0)

