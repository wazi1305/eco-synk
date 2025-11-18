"""
FastAPI server for EcoSynk AI Services
Provides endpoints for Opus workflows and frontend integration
"""

import os
import json
import uuid
import math
import base64
import tempfile
import traceback
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Body, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

from config import settings, validate_config
from gemini.trash_analyzer import TrashAnalyzer
from qdrant.vector_store import EcoSynkVectorStore
from embeddings.generator import EmbeddingGenerator
from yolo.waste_detector import WasteDetector
from geocoding import reverse_geocode
from campaigns import CampaignManager

from image_generation import (
    CampaignBannerGenerator,
    BannerResult,
    build_banner_prompt,
    build_negative_prompt,
)
from geocoding import reverse_geocode
from user_service import UserService



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


class AuditTrailRequest(BaseModel):
    """Request model for generating audit trail for Opus workflows"""
    workflow_id: str = Field(..., description="Opus workflow ID")
    report_id: str = Field(..., description="Report ID from analyze-trash")
    action_taken: str = Field(..., description="Action taken (e.g., 'FIND_VOLUNTEERS', 'CREATE_CAMPAIGN', 'ALERT_AUTHORITIES')")
    volunteers_matched: Optional[List[Dict[str, Any]]] = None
    additional_metadata: Optional[Dict[str, Any]] = None


class CampaignCreateRequest(BaseModel):
    """Request model for creating cleanup campaign"""
    hotspot_report_ids: List[str] = Field(..., description="List of report IDs that form this hotspot")
    location: LocationModel = Field(..., description="Central location of hotspot")
    campaign_name: Optional[str] = None
    target_funding_usd: Optional[float] = Field(default=500, ge=0)
    volunteer_goal: Optional[int] = Field(default=10, ge=1)
    duration_days: Optional[int] = Field(default=30, ge=1, le=365)


class ReportSearchRequest(BaseModel):
    """Request model for semantic trash report search"""
    query: str = Field(..., description="Natural language search query")
    limit: int = Field(default=10, ge=1, le=50)
    score_threshold: float = Field(default=0.35, ge=0.0, le=1.0)
    time_window_days: Optional[int] = Field(default=None, ge=1, le=365)
    location: Optional[LocationModel] = None
    radius_km: float = Field(default=5.0, ge=0.1, le=100.0)


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
    allow_origins=[
        "*",  # For hackathon - restrict in production
        "https://eco-synk-fj59-nf09njo7e-wazi1305s-projects.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instances (initialized on startup)
analyzer: Optional[TrashAnalyzer] = None
vector_store: Optional[EcoSynkVectorStore] = None
embedder: Optional[EmbeddingGenerator] = None
waste_detector: Optional[WasteDetector] = None
campaign_manager: Optional[CampaignManager] = None
banner_generator: Optional[CampaignBannerGenerator] = None
user_service: Optional[UserService] = None



def _normalize_payload_location(payload: Optional[Dict[str, Any]]) -> Optional[Dict[str, float]]:
    """Extract a normalized lat/lon dict from a payload."""
    if not payload:
        return None

    location = payload.get('location') or payload.get('metadata', {}).get('location') or {}
    lat = (
        location.get('lat') or
        location.get('latitude')
    )
    lon = (
        location.get('lon') or
        location.get('lng') or
        location.get('longitude')
    )

    try:
        if lat is None or lon is None:
            return None
        lat_val = float(lat)
        lon_val = float(lon)
    except (TypeError, ValueError):
        return None

    return {"lat": lat_val, "lon": lon_val}


def _calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in kilometers between two coordinates."""
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def _parse_timestamp(candidate: Optional[str]) -> Optional[datetime]:
    """Parse ISO timestamp strings into aware datetime objects."""
    if not candidate:
        return None
    try:
        parsed = datetime.fromisoformat(candidate.replace('Z', '+00:00'))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except Exception:
        return None


def _enrich_location(raw_location: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Normalize lat/lon values and attach human-readable context."""
    if not raw_location:
        return None

    lat = (
        raw_location.get('lat') or
        raw_location.get('latitude')
    )
    lon = (
        raw_location.get('lon') or
        raw_location.get('lng') or
        raw_location.get('longitude')
    )

    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (TypeError, ValueError):
        return None

    geo = {"lat": lat_f, "lon": lon_f}
    context = None
    label = None

    try:
        context = reverse_geocode(lat_f, lon_f)
        if context:
            label = context.get('name') or context.get('display_name')
    except Exception as geo_error:  # noqa: BLE001 - avoid breaking request flow
        print(f"⚠️  Reverse geocoding error: {geo_error}")
        context = None

    return {
        "geo": geo,
        "context": context,
        "label": label
    }


# ============================================================================
# Startup and Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global analyzer, vector_store, embedder, waste_detector
    global analyzer, vector_store, embedder, campaign_manager, banner_generator
    global analyzer, vector_store, embedder, waste_detector, campaign_manager, user_service

    
    print("\n" + "=" * 60)
    print("🚀 Starting EcoSynk AI Services")
    print("=" * 60)
    
    # Validate configuration
    if not validate_config():
        print("\n⚠️  WARNING: Some API keys are not configured")
        print("The server will start but some features may not work")
    
    # Initialize services with graceful error handling
    print("\n📦 Initializing services...")
    
    # Embedder (loads ML model from cache)
    try:
        print("  → Loading embedding model...")
        embedder = EmbeddingGenerator()
        print("  ✅ Embedder ready")
    except Exception as e:
        print(f"  ⚠️  Embedder failed: {e}")
        embedder = None
    
    # Qdrant (connects to cloud) - don't block startup if this fails
    try:
        print("  → Connecting to Qdrant...")
        vector_store = EcoSynkVectorStore()
        print("  → Setting up collections...")
        vector_store.setup_collections(recreate=False)
        print("  ✅ Qdrant ready")
    except Exception as e:
        print(f"  ⚠️  Qdrant connection failed: {e}")
        print("  ⚠️  Vector search features will not work")
        vector_store = None
    
    # Gemini (API client)
    try:
        print("  → Initializing Gemini API...")
        analyzer = TrashAnalyzer()
        print("  ✅ Gemini ready")
    except ValueError as e:
        print(f"  ⚠️  Gemini not configured: {e}")
        analyzer = None
    except Exception as e:
        print(f"  ⚠️  Gemini failed: {e}")
        analyzer = None
    

    # YOLOv8 Waste Detector
    try:
        print("  → Loading YOLOv8 waste detector...")
        waste_detector = WasteDetector()
        custom_model = Path(__file__).parent / 'yolo' / 'weights' / 'best.pt'
        if custom_model.exists():
            print(f"  → Found custom weights at {custom_model}")
            waste_detector.load_model(str(custom_model))
        else:
            print("  → Custom weights not found, using default yolov8n.pt")
            waste_detector.load_model('yolov8n.pt')  # Will auto-download if not present
        print("  ✅ YOLO detector ready")
    except Exception as e:
        print(f"  ⚠️  YOLO detector failed: {e}")
        print("  ⚠️  Will use Gemini-only analysis")
        waste_detector = None

    # Campaign Manager
    try:
        if vector_store and embedder:
            print("  → Initializing Campaign Manager...")
            campaign_manager = CampaignManager(vector_store, embedder)
            print("  ✅ Campaign Manager ready")
        else:
            print("  ⚠️  Campaign Manager requires vector store and embedder")
            campaign_manager = None
    except Exception as e:
        print(f"  ⚠️  Campaign Manager failed: {e}")
        campaign_manager = None

    # Imagen banner generator
    try:
        if settings.google_api_key:
            print("  → Initializing campaign banner generator...")
            banner_generator = CampaignBannerGenerator(
                api_key=settings.google_api_key,
                model_name=settings.google_imagen_model,
            )
            print("  ✅ Banner generator ready")
        else:
            print("  ⚠️  GOOGLE_API_KEY not set. Campaign banner generation disabled")
            banner_generator = None
    except Exception as e:
        print(f"  ⚠️  Banner generator failed: {e}")
        banner_generator = None
    # User Service
    try:
        print("  → Initializing User Service...")
        user_service = UserService()
        print("  ✅ User Service ready")
    except Exception as e:
        print(f"  ⚠️  User Service failed: {e}")
        user_service = None

    
    print("\n✅ Server startup complete!")
    print(f"📡 API endpoints available at http://{settings.api_host}:{settings.api_port}")
    print(f"📚 Documentation: http://{settings.api_host}:{settings.api_port}/docs")
    print("=" * 60 + "\n")


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
            "hotspots": "/detect-hotspots",
            "campaigns": "/campaigns",
            "create_campaign": "POST /campaigns"
        }
    }


async def _maybe_generate_campaign_banner(
    *,
    name: str,
    description: str,
    materials: Optional[List[str]],
    location_label: Optional[str],
) -> Optional[BannerResult]:
    """Generate a banner using the configured Imagen model if available."""

    if not banner_generator:
        return None

    material_text: Optional[str] = None
    if materials:
        cleaned = [str(item).strip() for item in materials if str(item).strip()]
        if cleaned:
            material_text = ", ".join(cleaned)

    prompt = build_banner_prompt(
        campaign_name=name,
        description=description,
        focus_materials=material_text,
        setting=location_label,
    )

    try:
        result = await banner_generator.generate_banner(
            prompt,
            negative_prompt=build_negative_prompt(),
        )
        return result
    except Exception as exc:
        print(f"⚠️  Banner generation failed: {exc}")
        return None


@app.get("/geocode/reverse")
async def geocode_reverse(
    lat: float = Query(..., description="Latitude to reverse geocode"),
    lon: float = Query(..., description="Longitude to reverse geocode"),
    include_raw: bool = Query(False, description="Include raw provider payload"),
):
    """Reverse geocode latitude/longitude into a human readable label."""
    try:
        rounded_lat = round(float(lat), 6)
        rounded_lon = round(float(lon), 6)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid latitude or longitude") from exc

    context = reverse_geocode(rounded_lat, rounded_lon)

    if not context:
        return {
            "lat": rounded_lat,
            "lon": rounded_lon,
            "label": None,
            "address": None,
            "display_name": None,
            "context": None,
        }

    label = context.get("name") or context.get("display_name")
    response_payload = {
        "lat": rounded_lat,
        "lon": rounded_lon,
        "label": label,
        "address": context.get("address"),
        "display_name": context.get("display_name"),
        "source": context.get("source", "openstreetmap"),
    }

    if include_raw:
        response_payload["context"] = context

    return response_payload


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
        location_info = None
        location_geo = None
        location_context = None
        location_label = None
        if location:
            location_data = json.loads(location)
            location_info = _enrich_location(location_data)
            if location_info:
                location_geo = location_info.get('geo')
                location_context = location_info.get('context')
                location_label = location_info.get('label')
        
        # Save uploaded file temporarily (cross-platform)
        file_extension = Path(file.filename).suffix or ".jpg"
        temp_fd, temp_path_str = tempfile.mkstemp(suffix=file_extension, prefix="ecosynk_upload_")
        temp_path = Path(temp_path_str)
        
        # Close the file descriptor and write the uploaded content
        os.close(temp_fd)
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Analyze with Gemini
        analysis = analyzer.analyze_trash_image(
            str(temp_path),
            location=location_geo,
            user_notes=user_notes
        )

        analysis_metadata = analysis.setdefault('metadata', {})
        if location_geo:
            analysis_metadata['location'] = location_geo
        if location_context:
            analysis_metadata['location_context'] = location_context
            if location_context.get('confidence') is not None:
                analysis_metadata['location_confidence'] = location_context.get('confidence')
            if location_context.get('source'):
                analysis_metadata['location_source'] = location_context.get('source')
        if location_label:
            analysis_metadata['location_name'] = location_label
        
        # Generate embedding
        embedding = embedder.generate_trash_report_embedding(analysis)
        
        # Store in Qdrant
        report_id = f"report_{datetime.utcnow().timestamp()}_{uuid.uuid4().hex[:8]}"
        
        # Prepare metadata for storage
        metadata = analysis.copy()
        if location_geo:
            metadata['location'] = location_geo
        if location_context:
            metadata['location_context'] = location_context
        if location_label:
            metadata['location_name'] = location_label
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
        response = {
            "status": "success",
            "report_id": report_id,
            "analysis": analysis,
            "message": "Trash report analyzed and stored successfully"
        }

        if location_geo:
            response["location"] = {
                **location_geo,
                **({"name": location_label} if location_label else {}),
                **({"context": location_context} if location_context else {})
            }

        return response
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        raise HTTPException(status_code=400, detail="Invalid location JSON")
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"❌ Analysis failed: {str(e)}")
        print(f"Stack trace:\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/detect-waste")
async def detect_waste(
    file: UploadFile = File(..., description="Image file for waste detection"),
    location: Optional[str] = Form(None, description="JSON string of location {lat, lon}"),
    user_id: Optional[str] = Form(None, description="User ID"),
    user_notes: Optional[str] = Form(None, description="User notes about the trash"),
    use_yolo: bool = Form(True, description="Use YOLO detection (true) or Gemini-only (false)")
):
    """
    Detect waste in image using YOLOv8 + Gemini AI hybrid approach
    
    This endpoint:
    1. Runs YOLOv8 detection to identify and locate waste items
    2. Enhances analysis with Gemini AI using detection context
    3. Generates comprehensive report with bounding boxes
    4. Stores in Qdrant with embedding
    5. Returns detections, annotated image (base64), and analysis
    """
    if analyzer is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini analyzer not configured. Please set GEMINI_API_KEY"
        )
    
    try:
        # Parse location if provided
        location_info = None
        location_geo = None
        location_context = None
        location_label = None
        if location:
            raw_location = json.loads(location)
            location_info = _enrich_location(raw_location)
            if location_info:
                location_geo = location_info.get('geo')
                location_context = location_info.get('context')
                location_label = location_info.get('label')
        
        # Save uploaded file temporarily
        file_extension = Path(file.filename).suffix or ".jpg"
        temp_fd, temp_path_str = tempfile.mkstemp(suffix=file_extension, prefix="ecosynk_detect_")
        temp_path = Path(temp_path_str)
        
        os.close(temp_fd)
        
        # Read and convert image to ensure compatibility with OpenCV
        try:
            from PIL import Image
            import io
            
            # Read uploaded file
            content = await file.read()
            
            # Open with PIL (supports AVIF, HEIC, WebP, etc.)
            pil_image = Image.open(io.BytesIO(content))
            
            # Convert to RGB if needed
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Save as JPEG (universally supported by OpenCV)
            pil_image.save(str(temp_path), 'JPEG', quality=95)
            print(f"📸 Image converted: {file.filename} -> JPEG for OpenCV compatibility")
            
        except Exception as e:
            print(f"⚠️  PIL conversion failed: {e}, saving as-is")
            # Fallback: save raw content
            with open(temp_path, "wb") as f:
                f.write(content)
        
        # Run YOLO detection if available and requested
        detections = []
        detection_summary = {}
        annotated_image_base64 = None
        
        if use_yolo and waste_detector is not None:
            print(f"🔍 Running YOLOv8 detection on {file.filename}...")
            detections = waste_detector.detect(str(temp_path))
            detection_summary = waste_detector.get_detection_summary(detections)
            
            # Generate annotated image only if we have detections and valid image
            if detections and len(detections) > 0:
                try:
                    annotated_path = temp_path.with_suffix('.annotated.jpg')
                    waste_detector.visualize_detections(
                        str(temp_path),
                        detections,
                        str(annotated_path)
                    )
                    
                    if annotated_path.exists():
                        print(f"📸 Annotated image created at: {annotated_path}")
                        print(f"📊 Annotated image size: {annotated_path.stat().st_size} bytes")
                        
                        # Convert annotated image to base64
                        with open(annotated_path, 'rb') as f:
                            annotated_image_base64 = base64.b64encode(f.read()).decode('utf-8')
                        
                        print(f"✅ Annotated image base64 length: {len(annotated_image_base64)}")
                        
                        # Cleanup annotated image
                        annotated_path.unlink()
                    else:
                        print("⚠️  Annotated image file not created")
                        
                except Exception as viz_error:
                    print(f"⚠️  Visualization failed: {viz_error}")
                    # Continue without annotated image
            else:
                print(f"ℹ️  No detections found, skipping visualization")
            
            print(f"✅ YOLO detected {len(detections)} waste items")
        
        # Analyze with Gemini (enhanced with YOLO context if available)
        analysis = analyzer.analyze_trash_image(
            str(temp_path),
            location=location_geo,
            user_notes=user_notes,
            yolo_detections=detections if detections else None
        )
        
        # Merge YOLO summary into analysis
        if detection_summary:
            analysis['yolo_detection'] = detection_summary
        
        analysis_metadata = analysis.setdefault('metadata', {})
        if location_geo:
            analysis_metadata['location'] = location_geo
        if location_context:
            analysis_metadata['location_context'] = location_context
            if location_context.get('confidence') is not None:
                analysis_metadata['location_confidence'] = location_context.get('confidence')
            if location_context.get('source'):
                analysis_metadata['location_source'] = location_context.get('source')
        if location_label:
            analysis_metadata['location_name'] = location_label

        # Generate embedding
        embedding = embedder.generate_trash_report_embedding(analysis)
        
        # Store in Qdrant
        report_id = f"report_{datetime.utcnow().timestamp()}_{uuid.uuid4().hex[:8]}"
        
        metadata = analysis.copy()
        if location_geo:
            metadata['location'] = location_geo
        if location_context:
            metadata['location_context'] = location_context
        if location_label:
            metadata['location_name'] = location_label
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
        
        # Return comprehensive response
        response = {
            "status": "success",
            "report_id": report_id,
            "analysis": analysis,
            "detections": detections,
            "detection_summary": detection_summary,
            "message": "Waste detection and analysis complete"
        }
        
        if location_geo:
            response["location"] = {
                **location_geo,
                **({"name": location_label} if location_label else {}),
                **({"context": location_context} if location_context else {})
            }

        if annotated_image_base64:
            response["annotated_image"] = f"data:image/jpeg;base64,{annotated_image_base64}"
            print(f"✅ Response includes annotated_image (length: {len(response['annotated_image'])})")
        else:
            print("⚠️  No annotated_image in response")
        
        return response
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        raise HTTPException(status_code=400, detail="Invalid location JSON")
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"❌ Detection failed: {str(e)}")
        print(f"Stack trace:\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")



@app.post("/detect-waste/live")
async def detect_waste_live(
    file: UploadFile = File(..., description="Video frame for live waste detection"),
    location: Optional[str] = Form(None, description="JSON string of location {lat, lon}"),
    include_summary: bool = Form(True, description="Include detection summary in response")
):
    """Run lightweight YOLO detection on a single frame for live preview overlays."""
    if waste_detector is None:
        raise HTTPException(
            status_code=503,
            detail="YOLO detector not configured. Live detection unavailable."
        )

    start_time = time.perf_counter()

    temp_path: Optional[Path] = None

    try:
        normalized_location = None
        if location:
            try:
                location_payload = json.loads(location)
                normalized_location = _normalize_payload_location(location_payload)
            except json.JSONDecodeError as decode_error:
                raise HTTPException(status_code=400, detail="Invalid location JSON") from decode_error

        file_extension = Path(file.filename or "frame.jpg").suffix or ".jpg"
        temp_fd, temp_path_str = tempfile.mkstemp(suffix=file_extension, prefix="ecosynk_live_")
        temp_path = Path(temp_path_str)
        os.close(temp_fd)

        frame_width = None
        frame_height = None

        raw_bytes = await file.read()

        try:
            from PIL import Image
            import io

            pil_image = Image.open(io.BytesIO(raw_bytes))
            frame_width, frame_height = pil_image.size

            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')

            pil_image.save(str(temp_path), 'JPEG', quality=90)
        except Exception as pil_error:  # noqa: BLE001 - log and fall back
            print(f"⚠️  Live frame conversion failed: {pil_error}. Saving raw bytes.")
            with open(temp_path, "wb") as fallback_file:
                fallback_file.write(raw_bytes)

            if frame_width is None or frame_height is None:
                try:
                    import cv2

                    cv_img = cv2.imread(str(temp_path))
                    if cv_img is not None:
                        frame_height, frame_width = cv_img.shape[:2]
                except Exception as cv_error:  # noqa: BLE001 - best effort metadata only
                    print(f"⚠️  Unable to derive frame dimensions: {cv_error}")

        detections = waste_detector.detect(str(temp_path))
        detection_summary = waste_detector.get_detection_summary(detections) if include_summary else None

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        response: Dict[str, Any] = {
            "status": "success",
            "detections": detections,
            "latency_ms": latency_ms
        }

        if include_summary:
            response["detection_summary"] = detection_summary

        if frame_width and frame_height:
            response["frame_dimensions"] = {"width": frame_width, "height": frame_height}

        if normalized_location:
            response["location"] = normalized_location

        return response

    except HTTPException:
        raise
    except Exception as error:
        error_trace = traceback.format_exc()
        print(f"❌ Live detection failed: {error}")
        print(f"Stack trace:\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Live detection failed: {error}") from error
    finally:
        if temp_path is not None:
            try:
                temp_path.unlink(missing_ok=True)
            except Exception:
                pass


 
@app.post("/reports/search")
async def search_reports(request: ReportSearchRequest):
    """Semantic search across stored trash reports using Qdrant"""
    if embedder is None or vector_store is None:
        raise HTTPException(status_code=503, detail="Search services are not initialized")

    try:
        print(f"🔎 Semantic search query received: '{request.query}'")
        query_embedding = embedder.generate_query_embedding(request.query)

        location_filter = None
        if request.location:
            location_filter = {
                'lat': request.location.lat,
                'lon': request.location.lon,
                'radius_km': request.radius_km
            }

        effective_threshold = request.score_threshold
        fallback_notes = []

        results = vector_store.find_similar_reports(
            embedding=query_embedding,
            limit=request.limit,
            score_threshold=effective_threshold,
            location_filter=location_filter,
            time_window_days=request.time_window_days
        )

        if not results and effective_threshold > 0.3:
            effective_threshold = 0.3
            results = vector_store.find_similar_reports(
                embedding=query_embedding,
                limit=request.limit,
                score_threshold=effective_threshold,
                location_filter=location_filter,
                time_window_days=request.time_window_days
            )
            fallback_notes.append("lowered score threshold to 0.30 for broader match")

        if not results and location_filter is not None:
            results = vector_store.find_similar_reports(
                embedding=query_embedding,
                limit=request.limit,
                score_threshold=effective_threshold,
                location_filter=None,
                time_window_days=request.time_window_days
            )
            fallback_notes.append("removed location filter to broaden match")

        response_items = []
        for item in results:
            data = item.get('data', {}) or {}
            report_id = data.get('report_id') or data.get('metadata', {}).get('report_id')
            timestamp = data.get('timestamp') or data.get('metadata', {}).get('analyzed_at')
            location = data.get('location') or data.get('metadata', {}).get('location')

            response_items.append({
                'report_id': report_id,
                'score': item.get('score'),
                'primary_material': data.get('primary_material'),
                'priority': data.get('cleanup_priority_score'),
                'description': data.get('description'),
                'timestamp': timestamp,
                'location': location,
                'analysis': data
            })

        applied_filters = {
            'location': location_filter,
            'time_window_days': request.time_window_days,
            'fallback_notes': fallback_notes if fallback_notes else None
        }

        return {
            'status': 'success',
            'query': request.query,
            'results': response_items,
            'count': len(response_items),
            'effective_score_threshold': effective_threshold,
            'applied_filters': applied_filters
        }

    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"❌ Report search failed: {e}")
        print(f"Stack trace:\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Report search failed: {str(e)}")


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


@app.get("/impact/esg")
async def get_esg_impact():
    """
    Calculate ESG (Environmental, Social, Governance) impact metrics
    
    Returns aggregate environmental impact data for reporting
    """
    try:
        # Get all trash reports
        all_reports = vector_store.client.scroll(
            collection_name=settings.trash_reports_collection,
            limit=1000,  # Get up to 1000 reports
            with_payload=True,
            with_vectors=False
        )
        
        # Get all volunteers
        all_volunteers = vector_store.client.scroll(
            collection_name=settings.volunteer_profiles_collection,
            limit=1000,
            with_payload=True,
            with_vectors=False
        )
        
        # Calculate metrics
        total_cleanups = len(all_reports[0])
        total_volunteers = len(all_volunteers[0])
        
        # Estimate waste removed (kg)
        volume_to_kg = {
            "small": 5,
            "medium": 25,
            "large": 100,
            "very_large": 500
        }
        
        total_waste_kg = 0
        high_priority_cleanups = 0
        hazardous_waste_removed = 0
        recyclable_waste_kg = 0
        
        for point in all_reports[0]:
            payload = point.payload
            volume = payload.get('estimated_volume', 'medium')
            priority = payload.get('cleanup_priority_score', 5)
            material = payload.get('primary_material', 'other')
            recyclable = payload.get('recyclable', False)
            
            waste_kg = volume_to_kg.get(volume, 25)
            total_waste_kg += waste_kg
            
            if priority >= 8:
                high_priority_cleanups += 1
            
            if material == 'hazardous':
                hazardous_waste_removed += waste_kg
            
            if recyclable:
                recyclable_waste_kg += waste_kg
        
        # Calculate volunteer hours (estimate 2 hours per cleanup)
        volunteer_hours = total_cleanups * 2
        
        # Calculate CO2 reduction (avg 0.5 kg CO2 per kg waste diverted from landfill)
        co2_reduction_kg = total_waste_kg * 0.5
        
        # Calculate economic value (avg $50 per cleanup)
        economic_value_usd = total_cleanups * 50
        
        # Calculate recycling rate
        recycling_rate = (recyclable_waste_kg / total_waste_kg * 100) if total_waste_kg > 0 else 0
        
        return {
            "status": "success",
            "esg_metrics": {
                "environmental": {
                    "total_waste_removed_kg": round(total_waste_kg, 2),
                    "co2_reduction_kg": round(co2_reduction_kg, 2),
                    "hazardous_waste_removed_kg": round(hazardous_waste_removed, 2),
                    "recyclable_waste_kg": round(recyclable_waste_kg, 2),
                    "recycling_rate_percent": round(recycling_rate, 1)
                },
                "social": {
                    "total_cleanups": total_cleanups,
                    "high_priority_cleanups": high_priority_cleanups,
                    "volunteer_hours_contributed": volunteer_hours,
                    "active_volunteers": total_volunteers,
                    "community_engagement_score": min(100, total_volunteers * 10)
                },
                "governance": {
                    "reports_analyzed": total_cleanups,
                    "ai_confidence_avg": 0.95,
                    "data_quality_score": 95,
                    "transparency_score": 100
                },
                "economic": {
                    "estimated_value_usd": economic_value_usd,
                    "cost_per_cleanup_usd": 50,
                    "volunteer_value_per_hour_usd": 25
                }
            },
            "summary": {
                "total_impact_score": min(100, (total_cleanups * 2) + (total_volunteers * 5)),
                "waste_diverted_from_landfill_kg": round(total_waste_kg, 2),
                "carbon_offset_equivalent_trees": round(co2_reduction_kg / 20, 1)  # 1 tree absorbs ~20kg CO2/year
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate ESG metrics: {str(e)}")


@app.get("/stats")
async def get_stats():
    """Get database statistics"""
    try:
        # Get actual counts by scrolling through collections
        trash_reports = vector_store.client.scroll(
            collection_name=settings.trash_reports_collection,
            limit=1,
            with_payload=False,
            with_vectors=False
        )
        
        volunteers = vector_store.client.scroll(
            collection_name=settings.volunteer_profiles_collection,
            limit=1,
            with_payload=False,
            with_vectors=False
        )
        
        # Count by getting offset
        trash_count = len(trash_reports[0]) if trash_reports[0] else 0
        volunteer_count = len(volunteers[0]) if volunteers[0] else 0
        
        # Get actual counts using count API
        try:
            trash_count = vector_store.client.count(
                collection_name=settings.trash_reports_collection
            ).count
            volunteer_count = vector_store.client.count(
                collection_name=settings.volunteer_profiles_collection
            ).count
        except:
            # Fallback to scroll if count fails
            pass
        
        return {
            "status": "success",
            "statistics": {
                "trash_reports": {
                    "count": trash_count,
                    "collection": settings.trash_reports_collection
                },
                "volunteers": {
                    "count": volunteer_count,
                    "collection": settings.volunteer_profiles_collection
                }
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@app.post("/audit/create")
async def create_audit_trail(request: AuditTrailRequest):
    """
    Create audit trail for Opus workflow integration
    
    Generates a comprehensive audit log of the workflow execution
    for compliance, reporting, and debugging purposes.
    """
    try:
        # Fetch the original report data from Qdrant
        report_data = None
        try:
            results = vector_store.client.scroll(
                collection_name=settings.trash_reports_collection,
                limit=100,
                with_payload=True,
                with_vectors=False
            )
            
            # Find report with matching report_id
            for point in results[0]:
                if point.payload.get('report_id') == request.report_id:
                    report_data = point.payload
                    break
        except Exception as e:
            # If we can't fetch, continue without it
            print(f"Warning: Could not fetch report data: {e}")
        
        # Generate audit trail
        audit_trail = {
            "audit_id": str(uuid.uuid4()),
            "workflow_id": request.workflow_id,
            "timestamp": datetime.utcnow().isoformat(),
            "report": {
                "report_id": request.report_id,
                "analysis": report_data if report_data else {"note": "Report data not available"},
                "action_taken": request.action_taken
            },
            "volunteers": {
                "matched_count": len(request.volunteers_matched) if request.volunteers_matched else 0,
                "volunteers": request.volunteers_matched if request.volunteers_matched else []
            },
            "decision_logic": {
                "action": request.action_taken,
                "reason": _get_action_reason(request.action_taken, report_data),
                "automated": True,
                "reviewed": False
            },
            "metadata": {
                "system": "EcoSynk AI Services",
                "api_version": "1.0",
                "gemini_model": settings.gemini_model,
                "embedding_model": "all-MiniLM-L6-v2",
                **(request.additional_metadata if request.additional_metadata else {})
            },
            "compliance": {
                "data_retention_days": 365,
                "privacy_compliant": True,
                "audit_trail_version": "1.0"
            }
        }
        
        return {
            "status": "success",
            "audit_trail": audit_trail,
            "message": "Audit trail created successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create audit trail: {str(e)}")


def _get_action_reason(action: str, report_data: Optional[Dict]) -> str:
    """Generate human-readable reason for action taken"""
    if not report_data:
        return f"Action '{action}' taken by workflow"
    
    priority = report_data.get('cleanup_priority_score', 0)
    risk = report_data.get('environmental_risk_level', 'unknown')
    material = report_data.get('primary_material', 'unknown')
    
    if action == "ALERT_AUTHORITIES":
        return f"Critical priority ({priority}) or {risk} risk level detected for {material} waste"
    elif action == "CREATE_CAMPAIGN":
        return f"High priority ({priority}) cleanup needed, hotspot detected"
    elif action == "FIND_VOLUNTEERS":
        return f"Standard cleanup ({priority} priority) for {material} waste"
    else:
        return f"Custom action for {material} waste with priority {priority}"


@app.post("/campaign/create")
async def create_campaign(request: CampaignCreateRequest):
    """
    Create a cleanup campaign for a hotspot area
    
    Aggregates multiple reports into a coordinated cleanup campaign
    with funding goals and volunteer targets.
    """
    try:
        # Fetch all reports for this hotspot
        reports = []
        total_priority = 0
        materials = []
        
        results = vector_store.client.scroll(
            collection_name=settings.trash_reports_collection,
            limit=100,
            with_payload=True,
            with_vectors=False
        )
        
        for point in results[0]:
            if point.payload.get('report_id') in request.hotspot_report_ids:
                reports.append(point.payload)
                total_priority += point.payload.get('cleanup_priority_score', 5)
                material = point.payload.get('primary_material')
                if material and material not in materials:
                    materials.append(material)
        
        if not reports:
            raise HTTPException(status_code=404, detail="No reports found for campaign")
        
        avg_priority = total_priority / len(reports) if reports else 5
        
        # Generate campaign name if not provided
        campaign_name = request.campaign_name
        if not campaign_name:
            material_str = ", ".join(materials[:2]) if materials else "mixed"
            campaign_name = f"Cleanup Campaign: {material_str.title()} Waste Hotspot"
        
        # Calculate campaign metrics
        campaign_id = f"campaign_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        campaign = {
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "location": {
                "lat": request.location.lat,
                "lon": request.location.lon
            },
            "hotspot": {
                "report_count": len(reports),
                "report_ids": request.hotspot_report_ids,
                "average_priority": round(avg_priority, 1),
                "materials": materials
            },
            "goals": {
                "target_funding_usd": request.target_funding_usd,
                "current_funding_usd": 0,
                "funding_progress_percent": 0,
                "volunteer_goal": request.volunteer_goal,
                "current_volunteers": 0,
                "volunteer_progress_percent": 0
            },
            "timeline": {
                "start_date": datetime.utcnow().isoformat(),
                "duration_days": request.duration_days,
                "end_date": (datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) 
                            + timedelta(days=request.duration_days)).isoformat()
            },
            "impact_estimates": {
                "estimated_waste_kg": len(reports) * 25,  # 25kg per report avg
                "estimated_volunteer_hours": request.volunteer_goal * 2,
                "estimated_co2_reduction_kg": len(reports) * 25 * 0.5
            }
        }
        
        # Generate embedding from campaign name and materials
        campaign_text = f"{campaign_name} {' '.join(materials)} cleanup campaign"
        campaign_embedding = embedder.generate_query_embedding(campaign_text)
        
        # Store in Qdrant
        vector_store.store_campaign(
            embedding=campaign_embedding,
            campaign_data=campaign,
            campaign_id=campaign_id
        )
        
        return {
            "status": "success",
            "campaign": campaign,
            "message": f"Campaign '{campaign_name}' created and stored successfully",
            "next_steps": [
                "View all campaigns: GET /campaigns",
                "Get active campaigns: GET /campaigns/active",
                "Share with volunteers via /find-volunteers"
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create campaign: {str(e)}")


@app.post("/analyze-trash/batch")
async def analyze_trash_batch(files: List[UploadFile] = File(...)):
    """
    Batch analyze multiple trash images at once
    
    Processes multiple images in parallel and returns aggregated results.
    """
    try:
        if len(files) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 images per batch")
        
        results = []
        errors = []
        
        # Create temp directory
        temp_dir = Path("/tmp/ecosynk/batch")
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        for i, file in enumerate(files):
            temp_path = None
            try:
                # Save file temporarily
                file_extension = Path(file.filename).suffix or ".jpg"
                temp_path = temp_dir / f"batch_{uuid.uuid4().hex}{file_extension}"
                
                with open(temp_path, "wb") as f:
                    content = await file.read()
                    f.write(content)
                
                # Analyze with Gemini
                analysis = analyzer.analyze_trash_image(str(temp_path))
                
                # Generate report ID
                report_id = f"report_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:8]}"
                
                # Add timestamp and metadata
                analysis['timestamp'] = datetime.utcnow().isoformat()
                analysis['report_id'] = report_id
                analysis['metadata'] = {
                    'analyzed_at': datetime.utcnow().isoformat(),
                    'image_name': file.filename,
                    'model_used': settings.gemini_model,
                    'batch_index': i
                }
                
                results.append({
                    "index": i,
                    "filename": file.filename,
                    "status": "success",
                    "report_id": report_id,
                    "analysis": analysis
                })
                
            except Exception as e:
                errors.append({
                    "index": i,
                    "filename": file.filename,
                    "status": "failed",
                    "error": str(e)
                })
            finally:
                # Cleanup temp file
                if temp_path and temp_path.exists():
                    temp_path.unlink()
        
        # Aggregate statistics
        total_priority = sum(r['analysis'].get('cleanup_priority_score', 0) for r in results)
        avg_priority = total_priority / len(results) if results else 0
        
        materials = {}
        for r in results:
            material = r['analysis'].get('primary_material', 'unknown')
            materials[material] = materials.get(material, 0) + 1
        
        return {
            "status": "success",
            "batch_summary": {
                "total_images": len(files),
                "successful": len(results),
                "failed": len(errors),
                "average_priority": round(avg_priority, 1),
                "materials_breakdown": materials
            },
            "results": results,
            "errors": errors if errors else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")


@app.put("/volunteer/{user_id}/availability")
async def update_volunteer_availability(user_id: str, available: bool):
    """
    Update volunteer availability status
    
    Toggle whether a volunteer is currently available for cleanups.
    """
    try:
        # Fetch volunteer profile
        results = vector_store.client.scroll(
            collection_name=settings.volunteer_profiles_collection,
            limit=100,
            with_payload=True,
            with_vectors=False
        )
        
        volunteer_found = None
        point_id = None
        
        for point in results[0]:
            if point.payload.get('user_id') == user_id:
                volunteer_found = point.payload
                point_id = point.id
                break
        
        if not volunteer_found:
            raise HTTPException(status_code=404, detail=f"Volunteer {user_id} not found")
        
        # Update availability
        volunteer_found['available'] = available
        volunteer_found['last_updated'] = datetime.utcnow().isoformat()
        
        # Update in Qdrant
        vector_store.client.set_payload(
            collection_name=settings.volunteer_profiles_collection,
            payload=volunteer_found,
            points=[point_id]
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "available": available,
            "message": f"Volunteer availability updated to {'available' if available else 'unavailable'}",
            "updated_at": volunteer_found['last_updated']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update availability: {str(e)}")


@app.get("/volunteers")
async def list_volunteers(
    limit: int = Query(100, ge=1, le=500),
    lat: Optional[float] = Query(None, description="Latitude for proximity filtering"),
    lon: Optional[float] = Query(None, description="Longitude for proximity filtering"),
    radius_km: float = Query(25.0, ge=0.1, le=500.0, description="Radius for distance filter"),
    available_only: bool = Query(False, description="Return only active volunteers"),
):
    """Return volunteer profiles with optional geo filtering."""
    try:
        if vector_store is None:
            raise HTTPException(status_code=503, detail="Vector store not initialized")

        reference_location = None
        if lat is not None and lon is not None:
            reference_location = {"lat": lat, "lon": lon}

        fetch_limit = min(max(limit * 2, 100), 512)
        results = vector_store.client.scroll(
            collection_name=settings.volunteer_profiles_collection,
            limit=fetch_limit,
            with_payload=True,
            with_vectors=False
        )

        volunteers: List[Dict[str, Any]] = []
        for point in results[0]:
            payload = point.payload or {}
            location = _normalize_payload_location(payload)

            if available_only and not payload.get('available', True):
                continue

            distance = None
            if reference_location and location:
                distance = _calculate_distance_km(
                    reference_location['lat'],
                    reference_location['lon'],
                    location['lat'],
                    location['lon']
                )
                if radius_km and distance > radius_km:
                    continue

            volunteer_entry = payload.copy()
            volunteer_entry.setdefault('user_id', str(point.id))
            if distance is not None:
                volunteer_entry['distance_km'] = round(distance, 2)

            volunteers.append(volunteer_entry)

        volunteers.sort(key=lambda v: v.get('past_cleanup_count', 0), reverse=True)
        volunteers = volunteers[:limit]

        return {
            "status": "success",
            "count": len(volunteers),
            "volunteers": volunteers,
            "filters": {
                "lat": lat,
                "lon": lon,
                "radius_km": radius_km if reference_location else None,
                "available_only": available_only
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list volunteers: {str(e)}")


@app.get("/trash-reports")
async def list_trash_reports(
    limit: int = Query(50, ge=1, le=500),
    lat: Optional[float] = Query(None, description="Latitude for proximity filtering"),
    lon: Optional[float] = Query(None, description="Longitude for proximity filtering"),
    radius_km: float = Query(25.0, ge=0.1, le=500.0, description="Radius for distance filter")
):
    """Return recent trash reports ordered by timestamp."""
    try:
        if vector_store is None:
            raise HTTPException(status_code=503, detail="Vector store not initialized")

        reference_location = None
        if lat is not None and lon is not None:
            reference_location = {"lat": lat, "lon": lon}

        fetch_limit = min(max(limit * 2, 100), 512)
        results = vector_store.client.scroll(
            collection_name=settings.trash_reports_collection,
            limit=fetch_limit,
            with_payload=True,
            with_vectors=False
        )

        reports: List[Dict[str, Any]] = []
        for point in results[0]:
            payload = point.payload or {}
            location = _normalize_payload_location(payload)

            distance = None
            if reference_location and location:
                distance = _calculate_distance_km(
                    reference_location['lat'],
                    reference_location['lon'],
                    location['lat'],
                    location['lon']
                )
                if radius_km and distance > radius_km:
                    continue

            timestamp = (
                payload.get('timestamp') or
                payload.get('metadata', {}).get('analyzed_at') or
                payload.get('metadata', {}).get('timestamp')
            )

            report_entry = payload.copy()
            if distance is not None:
                report_entry['distance_km'] = round(distance, 2)
            if timestamp:
                report_entry['timestamp'] = timestamp

            reports.append(report_entry)

        reports.sort(
            key=lambda report: _parse_timestamp(report.get('timestamp')) or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True
        )
        reports = reports[:limit]

        return {
            "status": "success",
            "count": len(reports),
            "reports": reports,
            "filters": {
                "lat": lat,
                "lon": lon,
                "radius_km": radius_km if reference_location else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list trash reports: {str(e)}")


@app.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """
    Get volunteer leaderboard ranked by cleanup count
    
    Shows top volunteers by number of cleanups completed.
    """
    try:
        # Fetch all volunteers
        results = vector_store.client.scroll(
            collection_name=settings.volunteer_profiles_collection,
            limit=100,
            with_payload=True,
            with_vectors=False
        )
        
        volunteers = []
        for point in results[0]:
            payload = point.payload
            volunteers.append({
                "user_id": payload.get('user_id', 'unknown'),
                "name": payload.get('name', 'Unknown'),
                "past_cleanup_count": payload.get('past_cleanup_count', 0),
                "experience_level": payload.get('experience_level', 'beginner'),
                "specializations": payload.get('specializations', []),
                "available": payload.get('available', True)
            })
        
        # Sort by cleanup count
        volunteers.sort(key=lambda v: v['past_cleanup_count'], reverse=True)
        
        # Add rankings
        leaderboard = []
        for i, volunteer in enumerate(volunteers[:limit], 1):
            leaderboard.append({
                "rank": i,
                **volunteer,
                "badge": _get_badge(volunteer['past_cleanup_count'])
            })
        
        return {
            "status": "success",
            "leaderboard": leaderboard,
            "total_volunteers": len(volunteers),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")


def _get_badge(cleanup_count: int) -> str:
    """Determine volunteer badge based on cleanup count"""
    if cleanup_count >= 50:
        return "🏆 Legend"
    elif cleanup_count >= 25:
        return "⭐ Champion"
    elif cleanup_count >= 10:
        return "🌟 Expert"
    elif cleanup_count >= 5:
        return "✨ Active"
    else:
        return "🌱 Beginner"


@app.get("/campaigns")
async def get_all_campaigns():
    """
    Get all campaigns (active and expired)
    
    Returns all campaigns stored in the system.
    """
    try:
        campaigns = vector_store.get_all_campaigns()
        
        return {
            "status": "success",
            "count": len(campaigns),
            "campaigns": campaigns
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaigns: {str(e)}")


@app.get("/campaigns/active")
async def get_active_campaigns_endpoint():
    """
    Get only active campaigns (not expired, status='active')
    
    Filters out campaigns that have passed their end date.
    """
    try:
        active_campaigns = vector_store.get_active_campaigns()
        
        return {
            "status": "success",
            "count": len(active_campaigns),
            "campaigns": active_campaigns,
            "message": f"Found {len(active_campaigns)} active campaign(s)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch active campaigns: {str(e)}")


@app.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    """
    Get a specific campaign by ID
    
    Returns detailed information about a single campaign.
    """
    try:
        campaign = vector_store.get_campaign_by_id(campaign_id)
        
        if not campaign:
            raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
        
        return {
            "status": "success",
            "campaign": campaign
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaign: {str(e)}")


# ============================================================================
# User Authentication Endpoints
# ============================================================================

from auth_models import UserRegisterRequest, UserLoginRequest, UserUpdateRequest

def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    if user_service:
        user_id = user_service.verify_jwt(token)
        if user_id:
            return user_service.get_user_by_id(user_id)
    return None

@app.post("/auth/register")
async def register_user(request: UserRegisterRequest):
    """Register a new user"""
    if user_service is None:
        raise HTTPException(status_code=503, detail="User service not available")
    
    try:
        result = user_service.register_user(
            name=request.name,
            email=request.email,
            password=request.password,
            bio=request.bio,
            location=request.location,
            city=request.city,
            country=request.country,
            interests=request.interests,
            skills=request.skills,
            experience_level=request.experience_level
        )
        
        if result["success"]:
            return {
                "status": "success",
                "user": result["user"],
                "token": result["token"],
                "message": "User registered successfully"
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/auth/login")
async def login_user(request: UserLoginRequest):
    """Login user"""
    if user_service is None:
        raise HTTPException(status_code=503, detail="User service not available")
    
    try:
        result = user_service.login_user(request.email, request.password)
        
        if result["success"]:
            return {
                "status": "success",
                "user": result["user"],
                "token": result["token"],
                "message": "Login successful"
            }
        else:
            raise HTTPException(status_code=401, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/auth/me")
async def get_current_user_profile(current_user = Depends(get_current_user)):
    """Get current user profile"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "status": "success",
        "user": current_user
    }

@app.get("/users/{user_id}/stats")
async def get_user_stats(user_id: str):
    """Get user activity statistics"""
    try:
        # Get all campaigns
        campaigns_result = vector_store.client.scroll(
            collection_name=settings.campaigns_collection,
            limit=1000,
            with_payload=True,
            with_vectors=False
        )
        
        # Get all trash reports
        reports_result = vector_store.client.scroll(
            collection_name=settings.trash_reports_collection,
            limit=1000,
            with_payload=True,
            with_vectors=False
        )
        
        # Calculate stats
        campaigns_joined = 0
        campaigns_created = 0
        donations_made = 0
        total_area_cleaned = 0
        total_co2_saved = 0
        cities = {}
        
        # Process campaigns
        for point in campaigns_result[0]:
            payload = point.payload or {}
            
            # Check if user created this campaign
            if payload.get('created_by') == user_id:
                campaigns_created += 1
            
            # Check if user joined (simplified - would need join tracking)
            # For now, assume user joined if they appear in volunteers list
            volunteers = payload.get('volunteers', [])
            if any(v.get('user_id') == user_id for v in volunteers):
                campaigns_joined += 1
                
                # Track cities
                location = payload.get('location', {})
                city = location.get('city') or 'Unknown'
                cities[city] = cities.get(city, 0) + 1
                
                # Estimate area cleaned (25 sq meters per campaign)
                total_area_cleaned += 25
                
                # Estimate CO2 saved (10kg per campaign)
                total_co2_saved += 10
        
        # Process trash reports for additional stats
        user_reports = 0
        for point in reports_result[0]:
            payload = point.payload or {}
            if payload.get('user_id') == user_id:
                user_reports += 1
                # Add CO2 from individual reports (2kg per report)
                total_co2_saved += 2
        
        # Find most common city
        most_common_city = max(cities.items(), key=lambda x: x[1])[0] if cities else 'None'
        
        return {
            "status": "success",
            "user_id": user_id,
            "stats": {
                "campaigns_joined": campaigns_joined,
                "campaigns_created": campaigns_created,
                "donations_made": donations_made,  # TODO: implement donation tracking
                "total_area_cleaned_sqm": total_area_cleaned,
                "avg_area_per_cleanup_sqm": total_area_cleaned / max(campaigns_joined, 1),
                "total_co2_saved_kg": total_co2_saved,
                "avg_co2_per_cleanup_kg": total_co2_saved / max(campaigns_joined + user_reports, 1),
                "most_common_city": most_common_city,
                "cities_worked_in": len(cities),
                "individual_reports": user_reports
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")

@app.post("/campaigns")
async def create_campaign_frontend(campaign_data: Dict[str, Any] = Body(...), current_user = Depends(get_current_user)):
    """
    Create a cleanup campaign from frontend form data
    
    Handles campaign creation requests from the frontend form.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to create campaigns")
    
    try:
        # Extract data from frontend format
        campaign_name = campaign_data.get('campaign_name', 'New Campaign')
        location = campaign_data.get('location', {})
        location_label = (
            campaign_data.get('location_label')
            or location.get('address')
            or location.get('label')
        )
        target_funding_usd = campaign_data.get('target_funding_usd', 500)
        volunteer_goal = campaign_data.get('volunteer_goal', 10)
        duration_days = campaign_data.get('duration_days', 30)
        estimated_waste_kg = campaign_data.get('estimated_waste_kg', 50)
        raw_materials = campaign_data.get('materials')
        if not raw_materials:
            raw_materials = campaign_data.get('hotspot', {}).get('materials')
        if isinstance(raw_materials, str):
            materials_list = [raw_materials]
        elif isinstance(raw_materials, list):
            materials_list = raw_materials
        else:
            materials_list = ['mixed']
        description = campaign_data.get('description', '')

        if embedder is None or vector_store is None:
            raise HTTPException(status_code=503, detail="Campaign services unavailable")
        
        # Generate campaign ID
        campaign_id = f"campaign_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        # Build campaign object
        campaign = {
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "description": description,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "location": {
                "lat": location.get('lat', 25.2048),
                "lon": location.get('lon', 55.2708),
                "address": location_label,
                "label": location_label,
                "name": location_label,
            },
            "hotspot": {
                "report_count": 1,
                "report_ids": [],
                "average_priority": 5,
                "materials": materials_list,
            },
            "goals": {
                "target_funding_usd": target_funding_usd,
                "current_funding_usd": 0,
                "funding_progress_percent": 0,
                "volunteer_goal": volunteer_goal,
                "current_volunteers": 0,
                "volunteer_progress_percent": 0
            },
            "timeline": {
                "start_date": datetime.utcnow().isoformat(),
                "duration_days": duration_days,
                "end_date": (datetime.utcnow() + timedelta(days=duration_days)).isoformat()
            },
            "impact_estimates": {
                "estimated_waste_kg": estimated_waste_kg,
                "estimated_volunteer_hours": volunteer_goal * 2,
                "estimated_co2_reduction_kg": estimated_waste_kg * 0.5
            }
        }

        # Enrich location context when missing human-readable label
        if (
            not location_label
            and campaign["location"].get("lat") is not None
            and campaign["location"].get("lon") is not None
        ):
            try:
                context = reverse_geocode(
                    float(campaign["location"]["lat"]),
                    float(campaign["location"]["lon"]),
                )
            except Exception:
                context = None

            if context:
                resolved_label = (
                    context.get("display_name")
                    or context.get("name")
                    or location_label
                )
                campaign["location"]["address"] = resolved_label
                campaign["location"]["label"] = resolved_label
                campaign["location"]["name"] = context.get("name") or resolved_label
                campaign["location"]["context"] = context

        banner_result = await _maybe_generate_campaign_banner(
            name=campaign_name,
            description=description,
            materials=materials_list,
            location_label=campaign["location"].get("address"),
        )

        if banner_result:
            campaign["banner"] = {
                "data_url": banner_result.data_url,
                "model": banner_result.model,
                "prompt": banner_result.prompt,
                "negative_prompt": banner_result.negative_prompt,
                "generated_at": datetime.utcnow().isoformat(),
            }
        
        # Generate embedding from campaign name and materials
        material_text = " ".join(materials_list)
        campaign_text = f"{campaign_name} {material_text} cleanup campaign"
        try:
            campaign_embedding = embedder.generate_query_embedding(campaign_text)
        except Exception as embedding_error:
            print("⚠️  Campaign embedding failed:")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Failed to create campaign: {embedding_error}") from embedding_error
        
        # Store in Qdrant
        try:
            vector_store.store_campaign(
                embedding=campaign_embedding,
                campaign_data=campaign,
                campaign_id=campaign_id
            )
        except Exception as storage_error:
            print("⚠️  Campaign storage failed:")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Failed to create campaign: {storage_error}") from storage_error
        
        return {
            "status": "success",
            "campaign": campaign,
            "message": f"Campaign '{campaign_name}' created successfully",
            "banner_generated": bool(banner_result),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print("❌  Campaign creation encountered an unexpected error:")
        traceback.print_exc()
        message = str(e) if str(e) else repr(e)
        raise HTTPException(status_code=500, detail=f"Failed to create campaign: {message}") from e


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import os
    from pathlib import Path
    
    # Get absolute paths to certificate files
    base_dir = Path(__file__).parent
    cert_file = base_dir / "cert.pem"
    key_file = base_dir / "key.pem"
    
    print("\n🚀 Starting EcoSynk AI Services API Server...")
    print(f"📡 Server will be available at: https://localhost:{settings.api_port}")
    print(f"📚 API Documentation: https://localhost:{settings.api_port}/docs")
    print(f"🔒 SSL Certificate: {cert_file}")
    print(f"🔑 SSL Key: {key_file}\n")
    
    uvicorn.run(
        "api_server:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info",
        ssl_keyfile=str(key_file),
        ssl_certfile=str(cert_file)
    )

