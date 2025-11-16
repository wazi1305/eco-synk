# EcoSynk AI Services - Setup Instructions

This guide will walk you through setting up all AI services for EcoSynk.

---

## 📋 Prerequisites

- Python 3.9 or higher
- Internet connection
- Terminal/Command line access

---

## 🚀 Quick Start (5 Steps)

### Step 1: Install Python Dependencies

Open your terminal in the project directory and run:

```bash
cd /Users/Muneeb1/Desktop/eco-synk
pip install -r requirements.txt
```

This installs:

- Google Gemini AI SDK
- Qdrant vector database client
- Sentence Transformers (embedding model)
- FastAPI web framework
- All supporting libraries

**Expected time:** 2-5 minutes

---

### Step 2: Get Gemini API Key

1. Go to [https://ai.google.dev/](https://ai.google.dev/)
2. Click "Get API Key" or "Get Started"
3. Sign in with your Google account
4. Create a new project (or use existing)
5. Click "Get API Key" → "Create API Key"
6. **Copy the API key** (starts with `AIza...`)

**Important:** Keep this key secret!

---

### Step 3: Set Up Qdrant Cloud

1. Go to [https://cloud.qdrant.io/](https://cloud.qdrant.io/)
2. Sign up with your email or GitHub
3. Create a new cluster:
   - Click "Create Cluster"
   - Choose **Free Tier** (1GB storage, perfect for hackathon)
   - Select region closest to you
   - Wait 1-2 minutes for cluster creation
4. Once created, click on your cluster
5. Copy two values:
   - **Cluster URL** (e.g., `https://xyz-abc.aws.cloud.qdrant.io:6333`)
   - **API Key** (click "Generate API Key" if not visible)

---

### Step 4: Create .env File

In the project root, create a file named `.env` (copy from `.env.example`):

```bash
cp .env.example .env
```

Then edit `.env` with your actual API keys:

```bash
# .env
GEMINI_API_KEY=AIza...your_actual_key_here
QDRANT_URL=https://your-cluster-url.qdrant.io:6333
QDRANT_API_KEY=your_actual_qdrant_key_here
AI_ML_API_KEY=2GENAIDUB

API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

**Save the file!**

---

### Step 5: Test Everything

Run these tests to verify setup:

#### 5a. Test Embeddings (should work immediately)

```bash
cd ai-services
python embeddings/generator.py
```

Expected output:

```
✅ Model loaded: all-MiniLM-L6-v2 (384D)
✅ Generated embedding with 384 dimensions
✅ All tests passed!
```

#### 5b. Test Qdrant Connection

```bash
python qdrant/vector_store.py
```

Expected output:

```
✅ Connected to Qdrant
✅ Created: trash_reports
✅ Created: volunteer_profiles
🎉 All collections ready!
```

#### 5c. Test Gemini (only works if you have API key)

```bash
python gemini/trash_analyzer.py
```

Expected output:

```
✅ Gemini analyzer initialized
📸 Ready to analyze images!
```

---

## 🧪 Create Test Data

To populate the database with sample volunteers and reports:

```bash
cd /Users/Muneeb1/Desktop/eco-synk
python tests/create_mock_data.py
```

This creates:

- 5 sample volunteer profiles
- 5 sample trash reports
- All with realistic data for testing

---

## 🚀 Start the API Server

Once everything is configured:

```bash
cd /Users/Muneeb1/Desktop/eco-synk/ai-services
python api_server.py
```

You should see:

```
🚀 Starting EcoSynk AI Services
✅ All services initialized!
📡 API server running at http://0.0.0.0:8000
📚 Documentation: http://localhost:8000/docs
```

Visit `http://localhost:8000/docs` to see interactive API documentation!

---

## 📡 API Endpoints for Your Team

**Base URL:** `http://localhost:8000`

#### 1. Analyze Trash Image

```bash
POST /analyze-trash
Content-Type: multipart/form-data

- file: image file
- location: {"lat": 37.7749, "lon": -122.4194}
- user_id: "user_123"
- user_notes: "Found near river"
```

#### 2. Find Volunteers

```bash
POST /find-volunteers
Content-Type: application/json

{
  "report_data": {...},  // from analyze-trash response
  "location": {"lat": 37.7749, "lon": -122.4194},
  "radius_km": 5.0,
  "limit": 10
}
```

#### 3. Detect Hotspots

```bash
POST /detect-hotspots
Content-Type: application/json

{
  "report_data": {...},
  "time_window_days": 30,
  "min_similar_reports": 3
}
```

Use the same endpoints, but from your React app:

```javascript
// Example: Analyze trash
const formData = new FormData();
formData.append("file", imageFile);
formData.append("location", JSON.stringify({ lat: 37.7749, lon: -122.4194 }));

const response = await fetch("http://localhost:8000/analyze-trash", {
  method: "POST",
  body: formData,
});

const result = await response.json();
console.log(result.analysis);
```

---

## 🔧 Troubleshooting

### "Module not found" error

```bash
pip install -r requirements.txt
```

### "API key not configured"

- Make sure `.env` file exists in project root
- Check that API keys don't have quotes or extra spaces
- Restart the server after changing `.env`

### Qdrant connection timeout

- Check your cluster URL includes the port (`:6333`)
- Verify your API key is correct
- Make sure you have internet connection

### Gemini analysis fails

- Verify API key is valid
- Check you have API quota (free tier: 60 requests/minute)
- Image must be JPG or PNG format

---

## 📊 Testing Your Setup

### Quick Health Check

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "services": {
    "gemini": true,
    "qdrant": true,
    "embedder": true
  }
}
```

### Get Statistics

```bash
curl http://localhost:8000/stats
```

Shows how many reports and volunteers are stored.

---

## 📚 Project Structure

```
eco-synk/
├── ai-services/
│   ├── gemini/
│   │   └── trash_analyzer.py      # Gemini image analysis
│   ├── qdrant/
│   │   └── vector_store.py        # Vector database
│   ├── embeddings/
│   │   └── generator.py           # Embedding generation
│   ├── config.py                  # Configuration
│   └── api_server.py              # FastAPI server
├── tests/
│   ├── create_mock_data.py        # Generate test data
│   └── test_integration.py        # Integration tests
├── .env                           # Your API keys (DON'T COMMIT!)
├── .env.example                   # Template
├── requirements.txt               # Python dependencies
└── SETUP_INSTRUCTIONS.md          # This file
```

---

## 🤝 Integration Checklist for Team

- [x] API server running on port 8000
- [x] `/analyze-trash` endpoint for image analysis
- [x] `/find-volunteers` endpoint for matching
- [x] `/detect-hotspots` endpoint for predictions
- [x] JSON responses with structured data
- [x] CORS enabled for frontend integration

---

## 🎯 Day 1 Goals Checklist

- [ ] All Python packages installed
- [ ] Gemini API key configured and tested
- [ ] Qdrant cluster created and connected
- [ ] Embedding model loaded successfully
- [ ] Mock data created (5 volunteers, 5 reports)
- [ ] API server running on port 8000
- [ ] Can access API docs at localhost:8000/docs
- [ ] Health check returns all services healthy
- [ ] Shared API documentation with team

---

## 📞 Need Help?

Common issues and solutions:

1. **Port 8000 already in use?**

   - Change `API_PORT=8001` in `.env`

2. **Slow model loading?**

   - First time downloads embedding model (~80MB)
   - Subsequent starts are fast

3. **Qdrant quota exceeded?**
   - Free tier is 1GB, plenty for hackathon
   - Delete old data if needed

---

Once you see "✅ All services initialized!" you're ready to integrate with the rest of the team.
