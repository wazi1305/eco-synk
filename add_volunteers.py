"""
Add volunteer profiles via API
"""

import requests
import json

API_BASE_URL = 'http://localhost:8000'

VOLUNTEERS = [
    {
        "user_id": "volunteer_001",
        "name": "Alex Johnson",
        "email": "alex.johnson@example.com",
        "phone": "+1-555-0101",
        "skills": ["waste sorting", "team coordination", "heavy lifting"],
        "experience_level": "advanced",
        "materials_expertise": ["plastic", "metal"],
        "specializations": ["river cleanup", "beach cleanup"],
        "equipment_owned": ["gloves", "waders", "truck"],
        "location": {"lat": 25.2048, "lon": 55.2708},  # Dubai coordinates
        "available": True,
        "past_cleanup_count": 25,
        "hours_contributed": 100,
        "bio": "Environmental engineer passionate about water conservation and marine cleanup.",
        "profile_picture_url": "https://via.placeholder.com/150/4299e1/ffffff?text=AJ",
        "emergency_contact": {
            "name": "Sarah Johnson",
            "phone": "+1-555-0102",
            "relationship": "spouse"
        }
    },
    {
        "user_id": "volunteer_002",
        "name": "Maria Garcia",
        "email": "maria.garcia@example.com",
        "phone": "+1-555-0201",
        "skills": ["environmental education", "photography", "social media"],
        "experience_level": "intermediate",
        "materials_expertise": ["plastic", "organic"],
        "specializations": ["park cleanup", "community organizing"],
        "equipment_owned": ["gloves", "bags"],
        "location": {"lat": 25.1972, "lon": 55.2744},  # Dubai Marina
        "available": True,
        "past_cleanup_count": 12,
        "hours_contributed": 48,
        "bio": "Community organizer focusing on plastic waste reduction and education.",
        "profile_picture_url": "https://via.placeholder.com/150/9f7aea/ffffff?text=MG",
        "emergency_contact": {
            "name": "Carlos Garcia",
            "phone": "+1-555-0202",
            "relationship": "brother"
        }
    },
    {
        "user_id": "volunteer_003",
        "name": "James Chen",
        "email": "james.chen@example.com",
        "phone": "+1-555-0301",
        "skills": ["hazmat handling", "safety coordination", "data collection"],
        "experience_level": "expert",
        "materials_expertise": ["hazardous", "electronic", "chemical"],
        "specializations": ["hazardous waste", "industrial cleanup"],
        "equipment_owned": ["hazmat suit", "testing kit", "van"],
        "location": {"lat": 25.2285, "lon": 55.3273},  # Deira
        "available": True,
        "past_cleanup_count": 50,
        "hours_contributed": 200,
        "bio": "Hazmat specialist with 10+ years experience in industrial waste management.",
        "profile_picture_url": "https://via.placeholder.com/150/f56565/ffffff?text=JC",
        "emergency_contact": {
            "name": "Lisa Chen",
            "phone": "+1-555-0302",
            "relationship": "wife"
        }
    },
    {
        "user_id": "volunteer_004",
        "name": "Sarah Williams",
        "email": "sarah.williams@example.com",
        "phone": "+1-555-0401",
        "skills": ["recycling", "composting", "workshop facilitation"],
        "experience_level": "intermediate",
        "materials_expertise": ["organic", "textile", "paper"],
        "specializations": ["community gardens", "composting programs"],
        "equipment_owned": ["gloves", "compost bins"],
        "location": {"lat": 25.2084, "lon": 55.2719},  # JBR
        "available": True,
        "past_cleanup_count": 18,
        "hours_contributed": 72,
        "bio": "Sustainable living advocate specializing in organic waste and community gardens.",
        "profile_picture_url": "https://via.placeholder.com/150/48bb78/ffffff?text=SW",
        "emergency_contact": {
            "name": "Mike Williams",
            "phone": "+1-555-0402",
            "relationship": "husband"
        }
    },
    {
        "user_id": "volunteer_005",
        "name": "David Kim",
        "email": "david.kim@example.com",
        "phone": "+1-555-0501",
        "skills": ["diving", "underwater cleanup", "marine biology"],
        "experience_level": "advanced",
        "materials_expertise": ["plastic", "metal", "fishing gear"],
        "specializations": ["ocean cleanup", "coral reef restoration"],
        "equipment_owned": ["diving gear", "underwater nets", "boat access"],
        "location": {"lat": 25.1318, "lon": 55.1621},  # Dubai Marina Beach
        "available": True,
        "past_cleanup_count": 35,
        "hours_contributed": 140,
        "bio": "Marine biologist dedicated to ocean conservation and underwater cleanup operations.",
        "profile_picture_url": "https://via.placeholder.com/150/ed8936/ffffff?text=DK",
        "emergency_contact": {
            "name": "Helen Kim",
            "phone": "+1-555-0502",
            "relationship": "sister"
        }
    }
]

def add_volunteers():
    print("🌱 Adding volunteer profiles to Qdrant via API...")
    
    for i, volunteer in enumerate(VOLUNTEERS, 1):
        try:
            print(f"  [{i}/{len(VOLUNTEERS)}] Creating profile for {volunteer['name']}...")
            
            response = requests.post(
                f"{API_BASE_URL}/volunteer-profile",
                json=volunteer,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"    ✅ Success: {result['message']}")
            else:
                print(f"    ❌ Failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"    ❌ Error: {e}")
    
    print(f"\n✅ Finished adding {len(VOLUNTEERS)} volunteer profiles!")

def check_leaderboard():
    print("\n🏆 Checking leaderboard...")
    try:
        response = requests.get(f"{API_BASE_URL}/leaderboard")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['total_volunteers']} volunteers:")
            for volunteer in data['leaderboard']:
                print(f"  {volunteer['rank']}. {volunteer['name']} - {volunteer['past_cleanup_count']} cleanups {volunteer['badge']}")
        else:
            print(f"❌ Leaderboard failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    add_volunteers()
    check_leaderboard()