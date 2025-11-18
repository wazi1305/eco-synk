"""
Gemini-powered trash analysis
Analyzes images to identify trash types, volumes, and cleanup priorities
"""

import json
import base64
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

import sys
import os
# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import google.generativeai as genai
except ImportError:
    genai = None
    print("⚠️  google-generativeai not installed. Run: pip install google-generativeai")

from config import settings


class TrashAnalyzer:
    """Analyzes trash images using Google Gemini multimodal AI"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Gemini trash analyzer
        
        Args:
            api_key: Optional Gemini API key (uses settings if not provided)
        """
        self.api_key = api_key or settings.gemini_api_key
        
        if not self.api_key or self.api_key == "your_gemini_api_key_here":
            raise ValueError(
                "Gemini API key not configured. "
                "Set GEMINI_API_KEY in your .env file"
            )
        
        if genai is None:
            raise ImportError("google-generativeai not installed")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
        print(f"✅ Gemini analyzer initialized with model: {settings.gemini_model}")
    
    def _create_analysis_prompt(self, yolo_detections: Optional[List[Dict[str, Any]]] = None) -> str:
        """Create the structured prompt for trash analysis"""
        
        base_prompt = """
Analyze this image for trash, waste, or pollution. You are an expert environmental analyst.
"""
        
        # Add YOLO detection context if available
        if yolo_detections:
            detection_context = "\n\n🤖 COMPUTER VISION DETECTIONS (YOLOv8):\n"
            detection_context += json.dumps(yolo_detections, indent=2)
            detection_context += "\n\nUse these detections to enhance your analysis. Verify the detected items, provide additional context about materials and environmental impact.\n"
            base_prompt += detection_context
        
        base_prompt += """
Return ONLY a valid JSON object with this exact structure (no markdown, no additional text):

{
    "primary_material": "plastic|metal|organic|hazardous|electronic|textile|mixed|other",
    "estimated_volume": "small|medium|large|very_large",
    "specific_items": ["list", "of", "identifiable", "items"],
    "cleanup_priority_score": 1-10,
    "description": "One clear sentence describing what you see",
    "recyclable": true/false,
    "requires_special_handling": true/false,
    "environmental_risk_level": "low|medium|high|critical",
    "recommended_equipment": ["list", "of", "equipment"],
    "estimated_cleanup_time_minutes": 15-240,
    "confidence_score": 0.0-1.0
}

Scoring guidelines:
- Priority score: Consider volume, material type, location hazard, environmental impact
- Environmental risk: hazardous materials = critical, large piles = high, recyclables = low
- Cleanup time: small items = 15-30min, medium = 30-60min, large = 60-120min, very large = 120-240min
- Confidence: How certain are you about this analysis?

Important:
- If no trash is visible, set priority_score to 0 and description to "No trash detected"
- Be specific about items you can identify
- Consider safety requirements in equipment recommendations
"""
        return base_prompt
    
    def analyze_trash_image(
        self, 
        image_path: str, 
        location: Optional[Dict[str, float]] = None,
        user_notes: Optional[str] = None,
        yolo_detections: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a trash image and return structured data
        
        Args:
            image_path: Path to the image file
            location: Optional dict with 'lat' and 'lon' keys
            user_notes: Optional user-provided context
            yolo_detections: Optional YOLOv8 detection results for enhanced analysis
            
        Returns:
            Dict containing analysis results with metadata
        """
        try:
            # Read and validate image
            image_path_obj = Path(image_path)
            if not image_path_obj.exists():
                raise FileNotFoundError(f"Image not found: {image_path}")
            
            # Read image data
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            # Prepare prompt with YOLO context if available
            prompt = self._create_analysis_prompt(yolo_detections=yolo_detections)
            if user_notes:
                prompt += f"\n\nUser notes: {user_notes}"
            
            # Call Gemini API
            print(f"🔍 Analyzing image: {image_path_obj.name}...")
            
            # Determine MIME type (normalize .jpg to .jpeg)
            file_ext = image_path_obj.suffix[1:].lower()
            if file_ext == 'jpg':
                file_ext = 'jpeg'
            mime_type = f"image/{file_ext}"
            
            # Create content with image
            response = self.model.generate_content([
                prompt,
                {
                    "mime_type": mime_type,
                    "data": image_data
                }
            ])
            
            # Parse response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            # Parse JSON
            analysis = json.loads(response_text)
            
            # Add metadata
            analysis['metadata'] = {
                'analyzed_at': datetime.utcnow().isoformat(),
                'image_name': image_path_obj.name,
                'model_used': settings.gemini_model,
                'location': location or {'lat': None, 'lon': None},
                'user_notes': user_notes
            }
            
            print(f"✅ Analysis complete: {analysis['primary_material']} - Priority {analysis['cleanup_priority_score']}/10")
            
            return analysis
            
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse Gemini response as JSON: {e}")
            print(f"Raw response: {response_text[:500]}")
            return self._create_error_response("Failed to parse AI response", image_path)
            
        except Exception as e:
            print(f"❌ Error analyzing image: {e}")
            return self._create_error_response(str(e), image_path)
    
    def _create_error_response(self, error: str, image_path: str) -> Dict[str, Any]:
        """Create a fallback response when analysis fails"""
        return {
            "primary_material": "unknown",
            "estimated_volume": "medium",
            "specific_items": [],
            "cleanup_priority_score": 5,
            "description": f"Analysis failed: {error}",
            "recyclable": False,
            "requires_special_handling": False,
            "environmental_risk_level": "medium",
            "recommended_equipment": ["gloves", "trash bags"],
            "estimated_cleanup_time_minutes": 30,
            "confidence_score": 0.0,
            "metadata": {
                'analyzed_at': datetime.utcnow().isoformat(),
                'image_name': Path(image_path).name,
                'error': error
            }
        }
    
    def batch_analyze(
        self, 
        image_paths: list[str],
        locations: Optional[list[Dict[str, float]]] = None
    ) -> list[Dict[str, Any]]:
        """
        Analyze multiple images in batch
        
        Args:
            image_paths: List of image file paths
            locations: Optional list of location dicts
            
        Returns:
            List of analysis results
        """
        if locations is None:
            locations = [None] * len(image_paths)
        
        results = []
        for i, (image_path, location) in enumerate(zip(image_paths, locations)):
            print(f"\n[{i+1}/{len(image_paths)}]")
            result = self.analyze_trash_image(image_path, location)
            results.append(result)
        
        return results


# Standalone test
if __name__ == "__main__":
    print("=" * 60)
    print("Gemini Trash Analyzer - Test Mode")
    print("=" * 60)
    
    try:
        analyzer = TrashAnalyzer()
        print("\n📸 Ready to analyze images!")
        print("Note: Place test images in the current directory")
        print("\nExample usage:")
        print("  result = analyzer.analyze_trash_image('trash.jpg', {'lat': 37.7749, 'lon': -122.4194})")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        print("\nSetup steps:")
        print("1. Get API key from: https://ai.google.dev/")
        print("2. Add to .env file: GEMINI_API_KEY=your_key_here")
        print("3. Run: pip install google-generativeai")

