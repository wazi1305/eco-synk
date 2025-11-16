"""
Create mock data for testing and development
Populates Qdrant with sample volunteer profiles and trash reports
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add ai-services directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'ai-services'))

from qdrant.vector_store import EcoSynkVectorStore
from embeddings.generator import EmbeddingGenerator


# Sample data
SAMPLE_VOLUNTEERS = [
    {
        "name": "Alex Johnson",
        "skills": ["waste sorting", "team coordination", "heavy lifting"],
        "experience_level": "advanced",
        "materials_expertise": ["plastic", "metal"],
        "specializations": ["river cleanup", "beach cleanup"],
        "equipment_owned": ["gloves", "waders", "truck"],
        "location": {"lat": 37.7749, "lon": -122.4194},  # San Francisco
        "available": True,
        "past_cleanup_count": 25
    },
    {
        "name": "Maria Garcia",
        "skills": ["environmental education", "photography", "social media"],
        "experience_level": "intermediate",
        "materials_expertise": ["plastic", "organic"],
        "specializations": ["park cleanup", "community organizing"],
        "equipment_owned": ["gloves", "bags"],
        "location": {"lat": 37.7849, "lon": -122.4094},
        "available": True,
        "past_cleanup_count": 12
    },
    {
        "name": "James Chen",
        "skills": ["hazmat handling", "safety coordination", "data collection"],
        "experience_level": "expert",
        "materials_expertise": ["hazardous", "electronic", "chemical"],
        "specializations": ["hazardous waste", "industrial cleanup"],
        "equipment_owned": ["hazmat suit", "testing kit", "van"],
        "location": {"lat": 37.7649, "lon": -122.4294},
        "available": True,
        "past_cleanup_count": 50
    },
    {
        "name": "Sarah Williams",
        "skills": ["recycling", "composting", "workshop facilitation"],
        "experience_level": "intermediate",
        "materials_expertise": ["organic", "textile", "paper"],
        "specializations": ["community gardens", "composting programs"],
        "equipment_owned": ["gloves", "compost bins"],
        "location": {"lat": 37.7549, "lon": -122.4394},
        "available": True,
        "past_cleanup_count": 18
    },
    {
        "name": "David Kim",
        "skills": ["diving", "underwater cleanup", "marine biology"],
        "experience_level": "advanced",
        "materials_expertise": ["plastic", "metal", "fishing gear"],
        "specializations": ["ocean cleanup", "coral reef restoration"],
        "equipment_owned": ["diving gear", "underwater nets", "boat access"],
        "location": {"lat": 37.7949, "lon": -122.3994},
        "available": True,
        "past_cleanup_count": 35
    }
]

SAMPLE_TRASH_REPORTS = [
    {
        "primary_material": "plastic",
        "estimated_volume": "large",
        "specific_items": ["water bottles", "plastic bags", "food containers"],
        "description": "Large accumulation of plastic waste near riverbank",
        "cleanup_priority_score": 8,
        "environmental_risk_level": "high",
        "recommended_equipment": ["gloves", "trash bags", "picker tools"],
        "location": {"lat": 37.7750, "lon": -122.4190}
    },
    {
        "primary_material": "metal",
        "estimated_volume": "medium",
        "specific_items": ["cans", "metal scraps", "wire"],
        "description": "Scattered metal debris in urban park",
        "cleanup_priority_score": 6,
        "environmental_risk_level": "medium",
        "recommended_equipment": ["gloves", "metal detector", "bags"],
        "location": {"lat": 37.7800, "lon": -122.4100}
    },
    {
        "primary_material": "hazardous",
        "estimated_volume": "small",
        "specific_items": ["batteries", "paint cans", "chemicals"],
        "description": "Hazardous waste dumped illegally",
        "cleanup_priority_score": 10,
        "environmental_risk_level": "critical",
        "recommended_equipment": ["hazmat suit", "containment bins", "safety gear"],
        "location": {"lat": 37.7650, "lon": -122.4300}
    },
    {
        "primary_material": "organic",
        "estimated_volume": "medium",
        "specific_items": ["food waste", "yard trimmings", "compostables"],
        "description": "Organic waste dumped near community garden",
        "cleanup_priority_score": 4,
        "environmental_risk_level": "low",
        "recommended_equipment": ["gloves", "compost bags"],
        "location": {"lat": 37.7550, "lon": -122.4400}
    },
    {
        "primary_material": "electronic",
        "estimated_volume": "small",
        "specific_items": ["old phones", "computer parts", "cables"],
        "description": "E-waste illegally disposed",
        "cleanup_priority_score": 7,
        "environmental_risk_level": "high",
        "recommended_equipment": ["gloves", "e-waste containers", "tools"],
        "location": {"lat": 37.7700, "lon": -122.4250}
    }
]


def create_mock_data():
    """Create and upload mock data to Qdrant"""
    
    print("\n" + "=" * 60)
    print("🏗️  Creating Mock Data for EcoSynk")
    print("=" * 60)
    
    # Initialize services
    print("\n[1/3] Initializing services...")
    try:
        embedder = EmbeddingGenerator()
        vector_store = EcoSynkVectorStore()
        vector_store.setup_collections(recreate=False)
        print("✅ Services initialized")
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        return False
    
    # Create volunteer profiles
    print(f"\n[2/3] Creating {len(SAMPLE_VOLUNTEERS)} volunteer profiles...")
    for i, volunteer in enumerate(SAMPLE_VOLUNTEERS, 1):
        try:
            embedding = embedder.generate_volunteer_profile_embedding(volunteer)
            user_id = f"volunteer_{i:03d}"
            vector_store.store_volunteer_profile(
                embedding=embedding,
                profile_data=volunteer,
                user_id=user_id
            )
            print(f"  ✓ Created profile for {volunteer['name']}")
        except Exception as e:
            print(f"  ✗ Failed to create {volunteer['name']}: {e}")
    
    # Create trash reports
    print(f"\n[3/3] Creating {len(SAMPLE_TRASH_REPORTS)} trash reports...")
    for i, report in enumerate(SAMPLE_TRASH_REPORTS, 1):
        try:
            embedding = embedder.generate_trash_report_embedding(report)
            report_id = f"report_{i:03d}"
            
            # Add timestamp
            timestamp = datetime.utcnow() - timedelta(days=random.randint(1, 30))
            report['timestamp'] = timestamp.isoformat()
            
            vector_store.store_trash_report(
                embedding=embedding,
                metadata=report,
                report_id=report_id
            )
            print(f"  ✓ Created report: {report['primary_material']} - {report['description'][:50]}...")
        except Exception as e:
            print(f"  ✗ Failed to create report {i}: {e}")
    
    # Create mock campaigns
    print("\n" + "=" * 60)
    print("3. Creating Mock Campaigns")
    print("=" * 60)
    
    campaigns = [
        {
            "campaign_id": "campaign_001",
            "campaign_name": "Downtown Plastic Cleanup Initiative",
            "status": "active",
            "created_at": "2025-11-01T10:00:00",
            "location": {"lat": 37.7749, "lon": -122.4194},
            "hotspot": {
                "report_count": 3,
                "report_ids": ["report_001", "report_002", "report_005"],
                "average_priority": 7.3,
                "materials": ["plastic", "metal"]
            },
            "goals": {
                "target_funding_usd": 1000,
                "current_funding_usd": 450,
                "funding_progress_percent": 45,
                "volunteer_goal": 25,
                "current_volunteers": 12,
                "volunteer_progress_percent": 48
            },
            "timeline": {
                "start_date": "2025-11-01T00:00:00",
                "duration_days": 60,
                "end_date": "2025-12-31T00:00:00"
            },
            "impact_estimates": {
                "estimated_waste_kg": 75,
                "estimated_volunteer_hours": 50,
                "estimated_co2_reduction_kg": 37.5
            }
        },
        {
            "campaign_id": "campaign_002",
            "campaign_name": "River Cleanup Campaign",
            "status": "active",
            "created_at": "2025-11-10T14:30:00",
            "location": {"lat": 37.78, "lon": -122.42},
            "hotspot": {
                "report_count": 2,
                "report_ids": ["report_002", "report_003"],
                "average_priority": 8.5,
                "materials": ["metal", "hazardous"]
            },
            "goals": {
                "target_funding_usd": 2000,
                "current_funding_usd": 800,
                "funding_progress_percent": 40,
                "volunteer_goal": 30,
                "current_volunteers": 8,
                "volunteer_progress_percent": 27
            },
            "timeline": {
                "start_date": "2025-11-10T00:00:00",
                "duration_days": 45,
                "end_date": "2025-12-25T00:00:00"
            },
            "impact_estimates": {
                "estimated_waste_kg": 100,
                "estimated_volunteer_hours": 60,
                "estimated_co2_reduction_kg": 50
            }
        },
        {
            "campaign_id": "campaign_003",
            "campaign_name": "Community Garden Cleanup",
            "status": "active",
            "created_at": "2025-11-14T09:00:00",
            "location": {"lat": 37.755, "lon": -122.44},
            "hotspot": {
                "report_count": 2,
                "report_ids": ["report_004", "report_005"],
                "average_priority": 5.5,
                "materials": ["organic", "plastic"]
            },
            "goals": {
                "target_funding_usd": 500,
                "current_funding_usd": 100,
                "funding_progress_percent": 20,
                "volunteer_goal": 15,
                "current_volunteers": 3,
                "volunteer_progress_percent": 20
            },
            "timeline": {
                "start_date": "2025-11-14T00:00:00",
                "duration_days": 30,
                "end_date": "2025-12-14T00:00:00"
            },
            "impact_estimates": {
                "estimated_waste_kg": 50,
                "estimated_volunteer_hours": 30,
                "estimated_co2_reduction_kg": 25
            }
        }
    ]
    
    for i, campaign in enumerate(campaigns, 1):
        try:
            # Generate embedding from campaign name and materials
            campaign_text = f"{campaign['campaign_name']} {' '.join(campaign['hotspot']['materials'])}"
            embedding = embedder.generate_query_embedding(campaign_text)
            
            vector_store.store_campaign(
                embedding=embedding,
                campaign_data=campaign,
                campaign_id=campaign['campaign_id']
            )
            print(f"  ✓ Created campaign: {campaign['campaign_name']}")
        except Exception as e:
            print(f"  ✗ Failed to create campaign {i}: {e}")
    
    # Show final stats
    print("\n" + "=" * 60)
    print("📊 Final Statistics:")
    print("=" * 60)
    vector_store.get_collection_stats()
    
    print("\n✅ Mock data creation complete!")
    print("\nYou can now:")
    print("  - Test volunteer matching")
    print("  - Test hotspot detection")
    print("  - Start the API server with real data")
    
    return True


if __name__ == "__main__":
    success = create_mock_data()
    sys.exit(0 if success else 1)

