"""
FastAPI server for EcoSynk AI Services
Provides endpoints for Opus workflows and frontend integration
"""

import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

from config import settings, validate_config
from gemini.trash_analyzer import TrashAnalyzer
from qdrant.vector_store import EcoSynkVectorStore
from embeddings.generator import EmbeddingGenerator


# ============================================================================
# Pydantic Models for Request/Response
# ============================================================================

class LocationModel(BaseModel):
    """Geographic location"""
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")


class TrashAnalysisRequest(BaseModel):
    """Request model for trash analysis"""
    location: Optional[LocationModel] = None
    user_id: Optional[str] = None
    user_notes: Optional[str] = None


class VolunteerMatchRequest(BaseModel):
    """Request model for volunteer matching"""
    report_data: Dict[str, Any] = Field(..., description="Trash report analysis data")
    location: LocationModel = Field(..., description="Cleanup location")
    radius_km: float = Field(default=5.0, ge=0.1, le=50.0, description="Search radius in km")
    limit: int = Field(default=10, ge=1, le=50, description="Max volunteers to return")
    min_match_score: float = Field(default=0.3, ge=0.0, le=1.0, description="Minimum similarity score (0-1)")


class HotspotDetectionRequest(BaseModel):
    """Request model for hotspot detection"""
    report_data: Dict[str, Any] = Field(..., description="Trash report data")
    time_window_days: int = Field(default=30, ge=1, le=365, description="Days to look back")
    min_similar_reports: int = Field(default=3, ge=2, le=20, description="Threshold for hotspot")


class VolunteerProfileRequest(BaseModel):
    """Request model for creating/updating volunteer profile"""
    user_id: Optional[str] = None
    name: str
    skills: List[str] = []
    experience_level: str = "beginner"
    materials_expertise: List[str] = []
    specializations: List[str] = []
    equipment_owned: List[str] = []
    location: LocationModel
    available: bool = True
    past_cleanup_count: int = 0


# ============================================================================
# FastAPI App Setup
# ============================================================================

app = FastAPI(
    title="EcoSynk AI Services",
    description="AI-powered trash analysis and volunteer matching for EcoSynk",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instances (initialized on startup)
analyzer: Optional[TrashAnalyzer] = None
vector_store: Optional[EcoSynkVectorStore] = None
embedder: Optional[EmbeddingGenerator] = None


# ============================================================================
# Startup and Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global analyzer, vector_store, embedder
    
    print("\n" + "=" * 60)
    print("🚀 Starting EcoSynk AI Services")
    print("=" * 60)
    
    # Validate configuration
    if not validate_config():
        print("\n⚠️  WARNING: Some API keys are not configured")
        print("The server will start but some features may not work")
    
    # Initialize services
    try:
        print("\n📦 Initializing services...")
        
        # Embedder (loads ML model)
        embedder = EmbeddingGenerator()
        
        # Qdrant (connects to cloud)
        vector_store = EcoSynkVectorStore()
        vector_store.setup_collections(recreate=False)
        
        # Gemini (API client)
        try:
            analyzer = TrashAnalyzer()
        except ValueError as e:
            print(f"⚠️  Gemini not configured: {e}")
            analyzer = None
        
        print("\n✅ All services initialized!")
        print(f"📡 API server running at http://{settings.api_host}:{settings.api_port}")
        print(f"📚 Documentation: http://localhost:{settings.api_port}/docs")
        print("=" * 60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Failed to initialize services: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("\n👋 Shutting down EcoSynk AI Services...")


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "EcoSynk AI Services",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "analyze": "/analyze-trash",
            "volunteers": "/find-volunteers",
            "hotspots": "/detect-hotspots"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "gemini": analyzer is not None,
            "qdrant": vector_store is not None,
            "embedder": embedder is not None
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/analyze-trash")
async def analyze_trash(
    file: UploadFile = File(..., description="Image file of trash"),
    location: Optional[str] = Form(None, description="JSON string of location {lat, lon}"),
    user_id: Optional[str] = Form(None, description="User ID"),
    user_notes: Optional[str] = Form(None, description="User notes about the trash")
):
    """
    Analyze a trash image using Gemini AI
    
    This endpoint:
    1. Accepts an image upload
    2. Analyzes it with Gemini to identify trash type, volume, priority
    3. Generates an embedding
    4. Stores the report in Qdrant
    5. Returns comprehensive analysis results
    """
    if analyzer is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini analyzer not configured. Please set GEMINI_API_KEY"
        )
    
    try:
        # Parse location if provided
        location_data = None
        if location:
            location_data = json.loads(location)
        
        # Save uploaded file temporarily
        temp_dir = Path("/tmp/ecosynk")
        temp_dir.mkdir(exist_ok=True)
        
        file_extension = Path(file.filename).suffix or ".jpg"
        temp_path = temp_dir / f"upload_{uuid.uuid4().hex}{file_extension}"
        
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Analyze with Gemini
        analysis = analyzer.analyze_trash_image(
            str(temp_path),
            location=location_data,
            user_notes=user_notes
        )
        
        # Generate embedding
        embedding = embedder.generate_trash_report_embedding(analysis)
        
        # Store in Qdrant
        report_id = f"report_{datetime.utcnow().timestamp()}_{uuid.uuid4().hex[:8]}"
        
        # Prepare metadata for storage
        metadata = analysis.copy()
        if user_id:
            metadata['user_id'] = user_id
        metadata['report_id'] = report_id
        
        vector_store.store_trash_report(
            embedding=embedding,
            metadata=metadata,
            report_id=report_id
        )
        
        # Cleanup temp file
        temp_path.unlink()
        
        # Return response
        return {
            "status": "success",
            "report_id": report_id,
            "analysis": analysis,
            "message": "Trash report analyzed and stored successfully"
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid location JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/find-volunteers")
async def find_volunteers(request: VolunteerMatchRequest):
    """
    Find volunteers with relevant skills near the cleanup location
    
    Uses vector similarity to match volunteer expertise with cleanup needs
    """
    try:
        # Generate embedding for the task
        task_embedding = embedder.generate_trash_report_embedding(request.report_data)
        
        # Search for matching volunteers
        volunteers = vector_store.find_nearby_volunteers(
            task_embedding=task_embedding,
            location={"lat": request.location.lat, "lon": request.location.lon},
            radius_km=request.radius_km,
            limit=request.limit,
            min_match_score=request.min_match_score
        )
        
        return {
            "status": "success",
            "count": len(volunteers),
            "volunteers": volunteers,
            "search_params": {
                "location": {"lat": request.location.lat, "lon": request.location.lon},
                "radius_km": request.radius_km
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Volunteer search failed: {str(e)}")


@app.post("/detect-hotspots")
async def detect_hotspots(request: HotspotDetectionRequest):
    """
    Detect if a location is a recurring trash hotspot
    
    Searches for similar past reports in the area
    """
    try:
        # Generate embedding
        embedding = embedder.generate_trash_report_embedding(request.report_data)
        
        # Find similar reports
        similar_reports = vector_store.find_similar_reports(
            embedding=embedding,
            limit=20,
            score_threshold=0.6,
            time_window_days=request.time_window_days
        )
        
        # Determine if hotspot
        is_hotspot = len(similar_reports) >= request.min_similar_reports
        
        # Calculate hotspot metrics
        if is_hotspot:
            # Get unique locations
            locations = []
            for report in similar_reports:
                loc = report['data'].get('metadata', {}).get('location')
                if loc and loc.get('lat') and loc.get('lon'):
                    locations.append(loc)
            
            hotspot_info = {
                "is_hotspot": True,
                "similar_reports_count": len(similar_reports),
                "severity": "high" if len(similar_reports) > 10 else "medium",
                "recommendation": "Consider launching a cleanup campaign",
                "past_reports": similar_reports[:5]  # Return top 5
            }
        else:
            hotspot_info = {
                "is_hotspot": False,
                "similar_reports_count": len(similar_reports),
                "severity": "low",
                "recommendation": "Single cleanup should be sufficient",
                "past_reports": similar_reports
            }
        
        return {
            "status": "success",
            **hotspot_info,
            "analysis_params": {
                "time_window_days": request.time_window_days,
                "threshold": request.min_similar_reports
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hotspot detection failed: {str(e)}")


@app.post("/volunteer-profile")
async def create_volunteer_profile(profile: VolunteerProfileRequest):
    """
    Create or update a volunteer profile
    """
    try:
        # Generate embedding from profile
        profile_dict = profile.dict()
        embedding = embedder.generate_volunteer_profile_embedding(profile_dict)
        
        # Prepare data for storage
        storage_data = profile_dict.copy()
        storage_data['location'] = {
            "lat": profile.location.lat,
            "lon": profile.location.lon
        }
        
        # Store in Qdrant
        user_id = vector_store.store_volunteer_profile(
            embedding=embedding,
            profile_data=storage_data,
            user_id=profile.user_id
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "message": "Volunteer profile created successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile creation failed: {str(e)}")


@app.get("/stats")
async def get_stats():
    """Get database statistics"""
    try:
        stats = vector_store.get_collection_stats()
        return {
            "status": "success",
            "statistics": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    print("\n🚀 Starting EcoSynk AI Services API Server...")
    print(f"📡 Server will be available at: http://localhost:{settings.api_port}")
    print(f"📚 API Documentation: http://localhost:{settings.api_port}/docs\n")
    
    uvicorn.run(
        "api_server:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info"
    )

