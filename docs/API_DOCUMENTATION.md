# EcoSynk AI Services - API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:8000`

---

## Overview

This API provides AI-powered trash analysis, volunteer matching, and hotspot detection for EcoSynk.

**Key Features:**

- 🔍 Multimodal trash image analysis (via Gemini)
- 👥 Intelligent volunteer matching (via Qdrant vector search)
- 🗺️ Trash hotspot detection
- 📊 Real-time statistics

---

## Authentication

No authentication required for hackathon. All endpoints are open.

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check if all services are running.

**Response:**

```json
{
  "status": "healthy",
  "services": {
    "gemini": true,
    "qdrant": true,
    "embedder": true
  },
  "timestamp": "2025-11-15T10:30:00Z"
}
```

---

### 2. Analyze Trash Image

**POST** `/analyze-trash`

Upload an image for AI-powered trash analysis.

**Content-Type:** `multipart/form-data`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file (JPG/PNG) |
| `location` | String (JSON) | No | `{"lat": 37.7749, "lon": -122.4194}` |
| `user_id` | String | No | User identifier |
| `user_notes` | String | No | Additional context from user |

**cURL Example:**

```bash
curl -X POST http://localhost:8000/analyze-trash \
  -F "file=@trash_image.jpg" \
  -F 'location={"lat": 37.7749, "lon": -122.4194}' \
  -F "user_id=user_123"
```

**JavaScript Example:**

```javascript
const formData = new FormData();
formData.append("file", imageFile);
formData.append("location", JSON.stringify({ lat: 37.7749, lon: -122.4194 }));
formData.append("user_id", "user_123");

const response = await fetch("http://localhost:8000/analyze-trash", {
  method: "POST",
  body: formData,
});

const result = await response.json();
```

**Response:**

```json
{
  "status": "success",
  "report_id": "report_1731668400_a3f8e9d2",
  "analysis": {
    "primary_material": "plastic",
    "estimated_volume": "large",
    "specific_items": ["water bottles", "plastic bags", "food containers"],
    "cleanup_priority_score": 8,
    "description": "Large pile of plastic waste near riverbank",
    "recyclable": true,
    "requires_special_handling": false,
    "environmental_risk_level": "high",
    "recommended_equipment": ["gloves", "trash bags", "picker tools"],
    "estimated_cleanup_time_minutes": 90,
    "confidence_score": 0.92,
    "metadata": {
      "analyzed_at": "2025-11-15T10:30:00Z",
      "image_name": "trash_image.jpg",
      "model_used": "gemini-2.5-flash",
      "location": { "lat": 37.7749, "lon": -122.4194 }
    }
  },
  "message": "Trash report analyzed and stored successfully"
}
```

**Material Types:**

- `plastic` - Plastic waste
- `metal` - Metal debris
- `organic` - Organic/compostable waste
- `hazardous` - Hazardous materials
- `electronic` - E-waste
- `textile` - Fabric/clothing
- `mixed` - Multiple materials
- `other` - Unknown/other

**Volume Types:**

- `small` - Can be handled by 1 person
- `medium` - Requires 2-3 people
- `large` - Requires team effort
- `very_large` - Requires campaign/heavy equipment

---

### 3. Find Volunteers

**POST** `/find-volunteers`

Find volunteers with relevant skills near a location.

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "report_data": {
    "primary_material": "plastic",
    "estimated_volume": "large",
    "specific_items": ["bottles", "bags"],
    "description": "Large cleanup needed",
    "cleanup_priority_score": 8
  },
  "location": {
    "lat": 37.7749,
    "lon": -122.4194
  },
  "radius_km": 5.0,
  "limit": 10
}
```

**Response:**

```json
{
  "status": "success",
  "count": 3,
  "volunteers": [
    {
      "user_id": "volunteer_001",
      "name": "Alex Johnson",
      "skills": ["waste sorting", "team coordination"],
      "experience_level": "advanced",
      "materials_expertise": ["plastic", "metal"],
      "location": { "lat": 37.7849, "lon": -122.4094 },
      "match_score": 0.87,
      "available": true,
      "past_cleanup_count": 25
    }
  ],
  "search_params": {
    "location": { "lat": 37.7749, "lon": -122.4194 },
    "radius_km": 5.0
  }
}
```

**Match Score:** 0.0 to 1.0 (higher = better match)

---

### 4. Detect Hotspots

**POST** `/detect-hotspots`

Detect if a location is a recurring trash hotspot.

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "report_data": {
    "primary_material": "plastic",
    "estimated_volume": "large",
    "description": "Trash accumulation",
    "cleanup_priority_score": 8
  },
  "time_window_days": 30,
  "min_similar_reports": 3
}
```

**Response (Hotspot Detected):**

```json
{
  "status": "success",
  "is_hotspot": true,
  "similar_reports_count": 7,
  "severity": "high",
  "recommendation": "Consider launching a cleanup campaign",
  "past_reports": [
    {
      "id": "report_001",
      "score": 0.92,
      "data": {
        "primary_material": "plastic",
        "timestamp": "2025-11-10T14:20:00Z"
      }
    }
  ],
  "analysis_params": {
    "time_window_days": 30,
    "threshold": 3
  }
}
```

**Response (Not a Hotspot):**

```json
{
  "status": "success",
  "is_hotspot": false,
  "similar_reports_count": 1,
  "severity": "low",
  "recommendation": "Single cleanup should be sufficient",
  "past_reports": [],
  "analysis_params": {
    "time_window_days": 30,
    "threshold": 3
  }
}
```

---

### 5. Create Volunteer Profile

**POST** `/volunteer-profile`

Create or update a volunteer profile.

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "user_id": "user_123",
  "name": "Alex Johnson",
  "skills": ["waste sorting", "team coordination"],
  "experience_level": "advanced",
  "materials_expertise": ["plastic", "metal"],
  "specializations": ["river cleanup", "beach cleanup"],
  "equipment_owned": ["gloves", "waders", "truck"],
  "location": {
    "lat": 37.7749,
    "lon": -122.4194
  },
  "available": true,
  "past_cleanup_count": 25
}
```

**Response:**

```json
{
  "status": "success",
  "user_id": "user_123",
  "message": "Volunteer profile created successfully"
}
```

---

### 6. Get Statistics

**GET** `/stats`

Get database statistics.

**Response:**

```json
{
  "status": "success",
  "statistics": {
    "trash_reports": {
      "count": 42,
      "vector_size": 384
    },
    "volunteers": {
      "count": 15,
      "vector_size": 384
    }
  },
  "timestamp": "2025-11-15T10:30:00Z"
}
```

---

## Data Models

### TrashAnalysisResult

```typescript
interface TrashAnalysisResult {
  primary_material:
    | "plastic"
    | "metal"
    | "organic"
    | "hazardous"
    | "electronic"
    | "textile"
    | "mixed"
    | "other";
  estimated_volume: "small" | "medium" | "large" | "very_large";
  specific_items: string[];
  cleanup_priority_score: number; // 1-10
  description: string;
  recyclable: boolean;
  requires_special_handling: boolean;
  environmental_risk_level: "low" | "medium" | "high" | "critical";
  recommended_equipment: string[];
  estimated_cleanup_time_minutes: number;
  confidence_score: number; // 0.0-1.0
  metadata: {
    analyzed_at: string;
    image_name: string;
    model_used: string;
    location: {
      lat: number;
      lon: number;
    };
  };
}
```

### VolunteerProfile

```typescript
interface VolunteerProfile {
  user_id: string;
  name: string;
  skills: string[];
  experience_level: "beginner" | "intermediate" | "advanced" | "expert";
  materials_expertise: string[];
  specializations: string[];
  equipment_owned: string[];
  location: {
    lat: number;
    lon: number;
  };
  available: boolean;
  past_cleanup_count: number;
  match_score?: number; // Only in search results
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message here"
}
```

**Common HTTP Status Codes:**

- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (API key not configured)

---

## Rate Limits

**Hackathon:** No rate limits

**Production:**

- Gemini: 60 requests/minute (free tier)
- Qdrant: 1GB storage (free tier)

---

## Integration Examples

### React Component Example

```javascript
import React, { useState } from "react";

function TrashReporter() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeTrash = async () => {
    setLoading(true);

    const formData = new FormData();
    formData.append("file", image);

    // Get user location
    navigator.geolocation.getCurrentPosition(async (position) => {
      formData.append(
        "location",
        JSON.stringify({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
      );

      try {
        const response = await fetch("http://localhost:8000/analyze-trash", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        setResult(data.analysis);
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div>
      <input type='file' accept='image/*' onChange={(e) => setImage(e.target.files[0])} />
      <button onClick={analyzeTrash} disabled={!image || loading}>
        {loading ? "Analyzing..." : "Analyze Trash"}
      </button>

      {result && (
        <div>
          <h3>Analysis Results</h3>
          <p>Material: {result.primary_material}</p>
          <p>Priority: {result.cleanup_priority_score}/10</p>
          <p>Description: {result.description}</p>
        </div>
      )}
    </div>
  );
}
```

### Opus Workflow Integration

```python
# In your Opus workflow

# Step 1: Analyze image
analysis_response = requests.post(
    "http://localhost:8000/analyze-trash",
    files={"file": image_data},
    data={"location": json.dumps(location_data)}
)

analysis = analysis_response.json()["analysis"]

# Step 2: Decision based on priority
if analysis["cleanup_priority_score"] >= 8:
    # High priority - find volunteers
    volunteers_response = requests.post(
        "http://localhost:8000/find-volunteers",
        json={
            "report_data": analysis,
            "location": location_data,
            "radius_km": 5.0
        }
    )
    volunteers = volunteers_response.json()["volunteers"]

    # Send notifications to volunteers
    for volunteer in volunteers:
        send_notification(volunteer["user_id"], analysis)
```

---

## Interactive Documentation

Visit `http://localhost:8000/docs` for interactive API documentation where you can test all endpoints directly in your browser!

---

## Support

For issues or questions:

- Check the health endpoint first
- Review SETUP_INSTRUCTIONS.md

---
