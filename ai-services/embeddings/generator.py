"""
Embedding generation for EcoSynk
Converts text/data into vector embeddings for similarity search
"""

import sys
import os
# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import numpy as np

from config import settings


class EmbeddingGenerator:
    """Generate vector embeddings for trash reports and volunteer profiles"""
    
    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize the embedding generator
        
        Args:
            model_name: Optional model name (uses settings if not provided)
        """
        self.model_name = model_name or settings.embedding_model
        
        print(f"📥 Loading embedding model: {self.model_name}...")
        try:
            self.model = SentenceTransformer(self.model_name)
            print(f"✅ Model loaded: {self.model_name} ({settings.embedding_dimension}D)")
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            raise
    
    def generate_trash_report_embedding(self, report_data: Dict[str, Any]) -> List[float]:
        """
        Generate embedding for a trash report
        Combines multiple features into a rich semantic representation
        
        Args:
            report_data: Dict containing analysis results from Gemini
            
        Returns:
            List of floats representing the embedding vector
        """
        # Extract relevant fields
        material = report_data.get('primary_material', 'unknown')
        volume = report_data.get('estimated_volume', 'medium')
        items = report_data.get('specific_items', [])
        description = report_data.get('description', '')
        risk_level = report_data.get('environmental_risk_level', 'medium')
        priority = report_data.get('cleanup_priority_score', 5)
        
        # Create rich text representation
        text_parts = [
            f"Material type: {material}",
            f"Volume: {volume}",
            f"Items found: {', '.join(items) if items else 'various items'}",
            f"Description: {description}",
            f"Environmental risk: {risk_level}",
            f"Priority level: {priority}/10"
        ]
        
        # Add equipment needs if available
        if 'recommended_equipment' in report_data:
            equipment = report_data['recommended_equipment']
            text_parts.append(f"Equipment needed: {', '.join(equipment)}")
        
        # Combine into single text
        combined_text = ". ".join(text_parts)
        
        # Generate embedding
        embedding = self.model.encode(combined_text, convert_to_numpy=True)
        
        return embedding.tolist()
    
    def generate_volunteer_profile_embedding(self, profile: Dict[str, Any]) -> List[float]:
        """
        Generate embedding for a volunteer profile
        Based on skills, experience, and past activities
        
        Args:
            profile: Dict containing volunteer information
            
        Returns:
            List of floats representing the embedding vector
        """
        # Extract relevant fields
        skills = profile.get('skills', [])
        experience = profile.get('experience_level', 'beginner')
        materials_expertise = profile.get('materials_expertise', [])
        specializations = profile.get('specializations', [])
        equipment_owned = profile.get('equipment_owned', [])
        past_cleanups = profile.get('past_cleanup_count', 0)
        
        # Create rich text representation
        text_parts = [
            f"Skills: {', '.join(skills) if skills else 'general volunteer'}",
            f"Experience level: {experience}",
            f"Material expertise: {', '.join(materials_expertise) if materials_expertise else 'all types'}",
            f"Specializations: {', '.join(specializations) if specializations else 'general cleanup'}",
        ]
        
        # Add experience indicator
        if past_cleanups > 0:
            text_parts.append(f"Completed {past_cleanups} cleanups")
        
        # Add equipment
        if equipment_owned:
            text_parts.append(f"Has equipment: {', '.join(equipment_owned)}")
        
        # Combine into single text
        combined_text = ". ".join(text_parts)
        
        # Generate embedding
        embedding = self.model.encode(combined_text, convert_to_numpy=True)
        
        return embedding.tolist()
    
    def generate_query_embedding(self, query_text: str) -> List[float]:
        """
        Generate embedding for a search query
        
        Args:
            query_text: Natural language search query
            
        Returns:
            List of floats representing the embedding vector
        """
        embedding = self.model.encode(query_text, convert_to_numpy=True)
        return embedding.tolist()
    
    def batch_generate(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts efficiently
        
        Args:
            texts: List of text strings
            
        Returns:
            List of embedding vectors
        """
        embeddings = self.model.encode(
            texts, 
            batch_size=32,
            show_progress_bar=len(texts) > 10,
            convert_to_numpy=True
        )
        return embeddings.tolist()
    
    def similarity_score(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Similarity score between 0 and 1
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        return float(similarity)


# Standalone test
if __name__ == "__main__":
    print("=" * 60)
    print("Embedding Generator - Test Mode")
    print("=" * 60)
    
    try:
        generator = EmbeddingGenerator()
        
        # Test trash report embedding
        print("\n🧪 Testing trash report embedding...")
        sample_report = {
            "primary_material": "plastic",
            "estimated_volume": "large",
            "specific_items": ["water bottles", "plastic bags", "food containers"],
            "description": "Large pile of plastic waste near riverbank",
            "environmental_risk_level": "high",
            "cleanup_priority_score": 8,
            "recommended_equipment": ["gloves", "trash bags", "picker tools"]
        }
        
        embedding = generator.generate_trash_report_embedding(sample_report)
        print(f"✅ Generated embedding with {len(embedding)} dimensions")
        print(f"   First 5 values: {embedding[:5]}")
        
        # Test volunteer profile embedding
        print("\n🧪 Testing volunteer profile embedding...")
        sample_profile = {
            "skills": ["waste sorting", "team coordination", "heavy lifting"],
            "experience_level": "advanced",
            "materials_expertise": ["plastic", "metal"],
            "specializations": ["river cleanup", "beach cleanup"],
            "equipment_owned": ["gloves", "waders", "truck"],
            "past_cleanup_count": 25
        }
        
        profile_embedding = generator.generate_volunteer_profile_embedding(sample_profile)
        print(f"✅ Generated embedding with {len(profile_embedding)} dimensions")
        
        # Test similarity
        print("\n🧪 Testing similarity calculation...")
        similarity = generator.similarity_score(embedding, profile_embedding)
        print(f"✅ Similarity score: {similarity:.3f}")
        
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        print("\nMake sure sentence-transformers is installed:")
        print("  pip install sentence-transformers")

