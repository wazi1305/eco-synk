"""
Configuration management for EcoSynk AI Services
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Load environment variables from .env file in parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

def parse_bool(value: Optional[str], default: bool = True) -> bool:
    """Parse boolean value from string, handling various formats"""
    if value is None:
        return default
    return value.lower() in ("true", "1", "yes", "on")

class Settings(BaseSettings):
    """Application settings"""
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="allow")
    
    # API Keys
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    qdrant_url: str = os.getenv("QDRANT_URL", "")
    qdrant_api_key: str = os.getenv("QDRANT_API_KEY", "")
    ai_ml_api_key: str = os.getenv("AI_ML_API_KEY", "2GENAIDUB")
    
    # Server Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    
    # Model Configuration
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    gemini_model: str = "gemini-2.5-flash"
    
    # Qdrant Configuration
    trash_reports_collection: str = "trash_reports"
    volunteer_profiles_collection: str = "volunteer_profiles"
    
    # Search Parameters
    default_search_limit: int = 10
    hotspot_threshold: int = 3
    default_radius_km: float = 5.0
    
    def __init__(self, **kwargs):
        # Override with env vars manually to avoid bool parsing issues
        api_host = os.getenv("API_HOST")
        if api_host:
            kwargs['api_host'] = api_host
        
        api_port = os.getenv("API_PORT")
        if api_port:
            kwargs['api_port'] = int(api_port)
        
        # Handle DEBUG specially to avoid bool parsing errors
        debug_env = os.getenv("DEBUG")
        if debug_env:
            kwargs['debug'] = parse_bool(debug_env, default=True)
        
        super().__init__(**kwargs)
    
# Global settings instance
settings = Settings()

def validate_config() -> bool:
    """Validate that all required API keys are set"""
    missing = []
    
    if not settings.gemini_api_key or settings.gemini_api_key == "your_gemini_api_key_here":
        missing.append("GEMINI_API_KEY")
    
    if not settings.qdrant_url or settings.qdrant_url == "https://your-cluster.qdrant.io:6333":
        missing.append("QDRANT_URL")
    
    if not settings.qdrant_api_key or settings.qdrant_api_key == "your_qdrant_api_key_here":
        missing.append("QDRANT_API_KEY")
    
    if missing:
        print(f"❌ Missing required API keys: {', '.join(missing)}")
        print("Please set them in your .env file")
        return False
    
    print("✅ All API keys configured")
    return True

