# EcoSynk - AI-Powered Community Pollution Combat Platform

**Tagline:** An AI-powered platform that intelligently synchronizes communities, data, and resources to combat pollution.

## 🎯 Overview

EcoSynk uses three cutting-edge technologies to create an intelligent trash detection and cleanup coordination system:

- **Google Gemini** - Multimodal AI for trash image analysis
- **Qdrant** - Vector database for intelligent search and matching
- **Sentence Transformers** - Semantic embeddings for similarity matching

## 🏗️ System Architecture

```
User uploads trash image
        ↓
Gemini AI analyzes image → Identifies material, volume, priority
        ↓
Generate 384D vector embedding → Semantic representation
        ↓
Store in Qdrant with location → Geo-indexed for fast search
        ↓
Find matching volunteers → By skills + proximity
        ↓
Detect hotspots → Similar reports in same area
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- API keys for Gemini and Qdrant

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start API server
cd ai-services
python api_server.py
```

### API Endpoints

**Base URL:** `http://localhost:8000`

- `POST /analyze-trash` - Analyze trash image with AI
- `POST /find-volunteers` - Match volunteers to cleanup tasks
- `POST /detect-hotspots` - Detect recurring trash locations
- `POST /volunteer-profile` - Create volunteer profiles
- `GET /health` - Health check
- `GET /stats` - Database statistics

**Interactive Docs:** http://localhost:8000/docs

## 📁 Project Structure

```
eco-synk/
├── ai-services/           # Core AI services
│   ├── gemini/           # Gemini image analysis
│   ├── qdrant/           # Vector database operations
│   ├── embeddings/       # Vector embedding generation
│   ├── config.py         # Configuration management
│   └── api_server.py     # FastAPI REST API
│
├── tests/                # Test utilities
│   ├── create_mock_data.py    # Generate test data
│   └── test_integration.py    # Integration tests
│
├── docs/                 # Documentation
│   └── API_DOCUMENTATION.md   # Complete API reference
│
├── test_images/          # Test images directory
├── .env                  # API keys (don't commit!)
├── .env.example          # Environment template
└── requirements.txt      # Python dependencies
```

## 🔑 Environment Variables

```bash
GEMINI_API_KEY=your_gemini_key          # From ai.google.dev
QDRANT_URL=your_qdrant_cluster_url      # From cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_key
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

## 🧪 Testing

```bash
# Create mock data (5 volunteers, 5 reports)
python tests/create_mock_data.py

# Run integration tests
python tests/test_integration.py

# Test with real image
curl -X POST http://localhost:8000/analyze-trash \
  -F "file=@test_images/your_image.jpg" \
  -F 'location={"lat": 37.7749, "lon": -122.4194}'
```

## 📊 Key Features

### 1. Multimodal Trash Analysis

- Identifies material type (plastic, metal, hazardous, etc.)
- Estimates volume and cleanup time
- Assigns priority scores
- Recommends equipment needed
- 95%+ confidence scores

### 2. Intelligent Volunteer Matching

- Semantic similarity matching (skills ↔ task needs)
- Geographic filtering (within radius)
- Experience-based ranking
- Equipment availability consideration

### 3. Hotspot Detection

- Finds similar reports in same area
- Identifies recurring pollution locations
- Severity scoring
- Campaign recommendations

### 4. Vector Search with Geo-Filtering

- 384-dimensional semantic embeddings
- Native Qdrant geo-radius filtering
- Cosine similarity scoring
- Sub-second query times

## 🎓 How It Works

### Image Analysis Flow

1. User uploads image + location
2. Gemini processes image (multimodal AI)
3. Returns structured JSON with material, priority, items
4. System generates embedding from analysis
5. Stores in Qdrant with geo-indexed location

### Volunteer Matching Flow

1. Convert cleanup task to vector embedding
2. Qdrant finds volunteers within radius
3. Rank by semantic similarity (skills match)
4. Filter by minimum match threshold
5. Return sorted list with distances

### Hotspot Detection Flow

1. Generate embedding from trash report
2. Search for similar reports (high similarity)
3. Filter by time window (e.g., last 30 days)
4. Count similar reports in area
5. Flag as hotspot if count exceeds threshold

## 📚 Documentation

- **Setup Guide:** `SETUP_INSTRUCTIONS.md` - Detailed setup with troubleshooting
- **API Reference:** `docs/API_DOCUMENTATION.md` - Complete API documentation
- **Quick Reference:** `QUICK_REFERENCE.md` - Command cheat sheet

## 🤝 Team Roles

- **Person A** (Frontend) - Integrates with API endpoints
- **Person B** (AI/Data) - Manages AI services and vector database
- **Person C** (Workflows) - Orchestrates with Opus automation

## 🔧 Tech Stack

- **Backend:** Python 3.11, FastAPI, Uvicorn
- **AI/ML:** Google Gemini, Sentence Transformers
- **Database:** Qdrant (vector + geo-indexed)
- **Embeddings:** all-MiniLM-L6-v2 (384D)

## 📝 License

See LICENSE file

## 🚀 Hackathon Credits

- Gemini API credits: LABLABX50
- Qdrant: Free tier (1GB)
- Built for: [Hackathon Name]
