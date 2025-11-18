#!/usr/bin/env python3
"""
Railway entry point for EcoSynk AI Services
"""
import os
import sys

# Add ai-services directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-services'))

# Import and run the FastAPI app
from api_server import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)