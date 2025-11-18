"""
Mock API server for EcoSynk Opus integration testing
FastAPI server that works with Opus content types
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import json
import uuid
from datetime import datetime
from typing import Optional
import urllib.parse

app = FastAPI(
    title="EcoSynk Mock API",
    description="Mock server for Opus workflow testing",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "EcoSynk Mock API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "analyze_file": "/analyze-trash",
            "analyze_json": "/analyze-trash-simple",
            "volunteers": "/find-volunteers"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "EcoSynk Mock API",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/analyze-trash")
async def mock_analyze_trash(
    file: UploadFile = File(...),
    location: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    user_notes: Optional[str] = Form(None)
):
    """
    Mock trash analysis with file upload (for frontend testing)
    """
    # Parse location
    location_data = None
    if location:
        try:
            location_data = json.loads(location)
        except:
            location_data = {"lat": 40.7128, "lon": -74.0060}

    # Generate realistic mock analysis
    mock_analysis = {
        "primary_material": "plastic",
        "estimated_volume": "medium", 
        "specific_items": ["water bottles", "plastic bags", "food containers"],
        "cleanup_priority_score": 7,
        "description": f"Pile of plastic waste analyzed from {file.filename}",
        "recyclable": True,
        "requires_special_handling": False,
        "environmental_risk_level": "medium",
        "recommended_equipment": ["gloves", "trash bags", "picker tools"],
        "estimated_cleanup_time_minutes": 45,
        "confidence_score": 0.85,
        "metadata": {
            "analyzed_at": datetime.utcnow().isoformat(),
            "image_name": file.filename,
            "location": location_data or {"lat": 40.7128, "lon": -74.0060},
            "user_notes": user_notes
        }
    }
    
    return {
        "status": "success",
        "report_id": f"mock_{uuid.uuid4().hex[:8]}",
        "analysis": mock_analysis,
        "message": "Mock analysis completed successfully"
    }

@app.post("/analyze-trash-simple")
async def mock_analyze_trash_simple(data: dict):
    """
    Simple JSON endpoint for Opus testing - WORKS WITH application/json
    """
    image_url = data.get('image_url', 'https://example.com/default.jpg')
    location = data.get('location', {'lat': 40.7128, 'lon': -74.0060})
    user_id = data.get('user_id', '')
    user_notes = data.get('user_notes', '')
    
    # Generate different mock analyses based on image_url for testing
    if "hazardous" in image_url.lower():
        # High priority scenario
        mock_analysis = {
            "primary_material": "hazardous",
            "estimated_volume": "medium",
            "specific_items": ["batteries", "chemical containers", "electronic waste"],
            "cleanup_priority_score": 9,
            "description": f"Hazardous materials detected at {image_url}",
            "recyclable": False,
            "requires_special_handling": True,
            "environmental_risk_level": "critical",
            "recommended_equipment": ["hazmat suit", "gloves", "special containers"],
            "estimated_cleanup_time_minutes": 120,
            "confidence_score": 0.92,
        }
    elif "large" in image_url.lower():
        # Large cleanup scenario
        mock_analysis = {
            "primary_material": "mixed",
            "estimated_volume": "large",
            "specific_items": ["furniture", "construction debris", "household items"],
            "cleanup_priority_score": 8,
            "description": f"Large illegal dumping site at {image_url}",
            "recyclable": True,
            "requires_special_handling": False,
            "environmental_risk_level": "high",
            "recommended_equipment": ["truck", "gloves", "trash bags", "shovels"],
            "estimated_cleanup_time_minutes": 180,
            "confidence_score": 0.88,
        }
    else:
        # Normal scenario
        mock_analysis = {
            "primary_material": "plastic",
            "estimated_volume": "medium", 
            "specific_items": ["water bottles", "plastic bags", "food containers"],
            "cleanup_priority_score": 7,
            "description": f"Pile of plastic waste analyzed from {image_url}",
            "recyclable": True,
            "requires_special_handling": False,
            "environmental_risk_level": "medium",
            "recommended_equipment": ["gloves", "trash bags", "picker tools"],
            "estimated_cleanup_time_minutes": 45,
            "confidence_score": 0.85,
        }

    # Add metadata
    mock_analysis["metadata"] = {
        "analyzed_at": datetime.utcnow().isoformat(),
        "image_url": image_url,
        "location": location,
        "user_id": user_id,
        "user_notes": user_notes
    }
    
    return {
        "status": "success", 
        "report_id": f"mock_{uuid.uuid4().hex[:8]}",
        "analysis": mock_analysis,
        "message": "Mock analysis completed successfully"
    }

@app.post("/analyze-trash-json")
async def mock_analyze_trash_json(request: Request):
    """
    Mock trash analysis that properly handles x-www-form-urlencoded
    """
    # Parse the form data
    body = await request.body()
    parsed_data = urllib.parse.parse_qs(body.decode())
    
    # Extract values (parse_qs returns lists, so take first element)
    image_url = parsed_data.get('image_url', [''])[0]
    location_str = parsed_data.get('location', ['{"lat": 40.7128, "lon": -74.0060}'])[0]
    user_id = parsed_data.get('user_id', [''])[0]
    user_notes = parsed_data.get('user_notes', [''])[0]
    
    # Parse location
    try:
        location_data = json.loads(location_str)
    except:
        location_data = {"lat": 40.7128, "lon": -74.0060}

    # Generate mock analysis
    if "hazardous" in image_url.lower():
        mock_analysis = {
            "primary_material": "hazardous",
            "estimated_volume": "medium",
            "specific_items": ["batteries", "chemical containers", "electronic waste"],
            "cleanup_priority_score": 9,
            "description": f"Hazardous materials detected at {image_url}",
            "recyclable": False,
            "requires_special_handling": True,
            "environmental_risk_level": "critical",
            "recommended_equipment": ["hazmat suit", "gloves", "special containers"],
            "estimated_cleanup_time_minutes": 120,
            "confidence_score": 0.92,
        }
    else:
        mock_analysis = {
            "primary_material": "plastic",
            "estimated_volume": "medium", 
            "specific_items": ["water bottles", "plastic bags", "food containers"],
            "cleanup_priority_score": 7,
            "description": f"Pile of plastic waste analyzed from {image_url}",
            "recyclable": True,
            "requires_special_handling": False,
            "environmental_risk_level": "medium",
            "recommended_equipment": ["gloves", "trash bags", "picker tools"],
            "estimated_cleanup_time_minutes": 45,
            "confidence_score": 0.85,
        }

    # Add metadata
    mock_analysis["metadata"] = {
        "analyzed_at": datetime.utcnow().isoformat(),
        "image_url": image_url,
        "location": location_data,
        "user_id": user_id,
        "user_notes": user_notes
    }
    
    return {
        "status": "success", 
        "report_id": f"mock_{uuid.uuid4().hex[:8]}",
        "analysis": mock_analysis,
        "message": "Mock analysis completed successfully"
    }

@app.post("/find-volunteers")
async def mock_find_volunteers():
    """
    Mock volunteer matching - returns different volunteers based on scenario
    """
    # Return different volunteers based on priority
    mock_volunteers = [
        {
            "user_id": "vol_001",
            "name": "Sarah Chen",
            "skills": ["waste sorting", "team coordination", "hazardous materials"],
            "experience_level": "advanced",
            "materials_expertise": ["plastic", "hazardous", "electronic"],
            "specializations": ["river cleanup", "hazardous waste"],
            "equipment_owned": ["gloves", "hazmat kit", "truck"],
            "location": {"lat": 40.7128, "lon": -74.0060},
            "distance_km": 1.2,
            "match_score": 0.87,
            "available": True,
            "past_cleanup_count": 25
        },
        {
            "user_id": "vol_002",
            "name": "Marcus Johnson", 
            "skills": ["heavy lifting", "equipment operation", "logistics"],
            "experience_level": "intermediate",
            "materials_expertise": ["metal", "construction", "furniture"],
            "specializations": ["large cleanups", "construction sites"],
            "equipment_owned": ["truck", "gloves", "tools"],
            "location": {"lat": 40.7150, "lon": -74.0090},
            "distance_km": 2.5,
            "match_score": 0.76,
            "available": True,
            "past_cleanup_count": 12
        },
        {
            "user_id": "vol_003",
            "name": "Jessica Williams",
            "skills": ["community organizing", "recycling", "education"],
            "experience_level": "beginner",
            "materials_expertise": ["plastic", "paper", "organic"],
            "specializations": ["park cleanups", "community events"],
            "equipment_owned": ["gloves", "trash bags"],
            "location": {"lat": 40.7100, "lon": -74.0120},
            "distance_km": 3.1,
            "match_score": 0.65,
            "available": True,
            "past_cleanup_count": 5
        }
    ]
    
    return {
        "status": "success",
        "count": len(mock_volunteers),
        "volunteers": mock_volunteers,
        "search_params": {
            "radius_km": 5.0,
            "min_match_score": 0.3
        }
    }

@app.post("/detect-hotspots")
async def mock_detect_hotspots():
    """
    Mock hotspot detection
    """
    return {
        "status": "success",
        "is_hotspot": True,
        "similar_reports_count": 8,
        "severity": "high",
        "recommendation": "This is a recurring trash hotspot. Consider launching a cleanup campaign.",
        "past_reports": [
            {"timestamp": "2024-01-01T10:00:00Z", "priority": 7},
            {"timestamp": "2024-01-02T14:30:00Z", "priority": 6},
            {"timestamp": "2024-01-03T09:15:00Z", "priority": 8}
        ]
    }

@app.post("/volunteer-profile")
async def mock_volunteer_profile():
    """
    Mock volunteer profile creation
    """
    return {
        "status": "success",
        "user_id": f"user_{uuid.uuid4().hex[:8]}",
        "message": "Volunteer profile created successfully"
    }

@app.get("/stats")
async def mock_stats():
    """
    Mock database statistics
    """
    return {
        "status": "success",
        "statistics": {
            "trash_reports": {"count": 47, "vector_size": 384},
            "volunteers": {"count": 23, "vector_size": 384}
        },
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*50)
    print("🚀 EcoSynk Mock API Server Starting...")
    print("📍 Endpoints available at: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🎯 Opus-compatible endpoints:")
    print("   /analyze-trash-simple (application/json)")
    print("   /analyze-trash-json (x-www-form-urlencoded)")
    print("="*50 + "\n")
    
    uvicorn.run(
        "mock_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )