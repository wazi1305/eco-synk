"""
Campaign management system for EcoSynk
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from pydantic import BaseModel
import uuid
from embeddings.generator import EmbeddingGenerator
from qdrant.vector_store import EcoSynkVectorStore

class CampaignGoals(BaseModel):
    target_funding_usd: float
    current_funding_usd: float = 0
    funding_progress_percent: float = 0
    volunteer_goal: int
    current_volunteers: int = 0
    volunteer_progress_percent: float = 0

class CampaignTimeline(BaseModel):
    start_date: str
    duration_days: int
    end_date: str

class ImpactEstimates(BaseModel):
    estimated_waste_kg: float
    estimated_volunteer_hours: int
    estimated_co2_reduction_kg: float

class CampaignHotspot(BaseModel):
    report_count: int
    report_ids: List[str]
    average_priority: float
    materials: List[str]

class Campaign(BaseModel):
    campaign_id: str
    campaign_name: str
    status: str = "active"
    created_at: str
    location: Dict[str, float]
    hotspot: CampaignHotspot
    goals: CampaignGoals
    timeline: CampaignTimeline
    impact_estimates: ImpactEstimates

class CampaignManager:
    def __init__(self, vector_store: EcoSynkVectorStore, embedding_generator: EmbeddingGenerator):
        self.vector_store = vector_store
        self.embedding_generator = embedding_generator
        self.collection_name = "campaigns"
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Ensure campaigns collection exists"""
        try:
            from qdrant_client.models import Distance, VectorParams
            self.vector_store.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
        except:
            pass  # Collection already exists
    
    def create_campaign(self, campaign_data: Dict) -> Dict:
        """Create a new campaign"""
        # Generate campaign ID
        campaign_id = f"campaign_{uuid.uuid4().hex[:8]}"
        
        # Calculate timeline
        start_date = datetime.fromisoformat(campaign_data["start_date"])
        duration = campaign_data["duration_days"]
        end_date = start_date + timedelta(days=duration)
        
        # Build campaign object
        campaign = Campaign(
            campaign_id=campaign_id,
            campaign_name=campaign_data["campaign_name"],
            created_at=datetime.now().isoformat(),
            location=campaign_data["location"],
            hotspot=CampaignHotspot(**campaign_data["hotspot"]),
            goals=CampaignGoals(**campaign_data["goals"]),
            timeline=CampaignTimeline(
                start_date=campaign_data["start_date"],
                duration_days=duration,
                end_date=end_date.isoformat()
            ),
            impact_estimates=ImpactEstimates(**campaign_data["impact_estimates"])
        )
        
        # Generate embedding from campaign description
        text = f"{campaign.campaign_name} {' '.join(campaign.hotspot.materials)} priority:{campaign.hotspot.average_priority}"
        embedding = self.embedding_generator.generate_embedding(text)
        
        # Store in Qdrant
        from qdrant_client.models import PointStruct
        self.vector_store.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=campaign_id,
                    vector=embedding,
                    payload=campaign.dict()
                )
            ]
        )
        
        return campaign.dict()
    
    def get_campaigns(self, limit: int = 10) -> List[Dict]:
        """Get all campaigns"""
        results = self.vector_store.client.scroll(
            collection_name=self.collection_name,
            limit=limit,
            with_payload=True,
            with_vectors=False
        )
        return [point.payload for point in results[0]]
    
    def get_campaign(self, campaign_id: str) -> Optional[Dict]:
        """Get specific campaign"""
        try:
            result = self.vector_store.client.retrieve(
                collection_name=self.collection_name,
                ids=[campaign_id],
                with_payload=True
            )
            return result[0].payload if result else None
        except:
            return None
    
    def update_campaign_progress(self, campaign_id: str, funding: float = None, volunteers: int = None) -> Dict:
        """Update campaign progress"""
        campaign = self.get_campaign(campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")
        
        if funding is not None:
            campaign["goals"]["current_funding_usd"] = funding
            campaign["goals"]["funding_progress_percent"] = min(100, (funding / campaign["goals"]["target_funding_usd"]) * 100)
        
        if volunteers is not None:
            campaign["goals"]["current_volunteers"] = volunteers
            campaign["goals"]["volunteer_progress_percent"] = min(100, (volunteers / campaign["goals"]["volunteer_goal"]) * 100)
        
        # Update in database
        text = f"{campaign['campaign_name']} {' '.join(campaign['hotspot']['materials'])} priority:{campaign['hotspot']['average_priority']}"
        embedding = self.embedding_generator.generate_embedding(text)
        
        from qdrant_client.models import PointStruct
        self.vector_store.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=campaign_id,
                    vector=embedding,
                    payload=campaign
                )
            ]
        )
        
        return campaign