#!/usr/bin/env python3
"""
Railway entry point for EcoSynk AI Services
"""
import os
import sys
import subprocess

# Download model on first run
try:
    subprocess.run([sys.executable, "download_model.py"], check=True)
except Exception as e:
    print(f"Model download failed: {e}, continuing...")

# Add ai-services directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-services'))

# Import and run the FastAPI app
try:
    from api_server import app
except ImportError:
    sys.path.append('ai-services')
    from api_server import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)