"""
Qdrant vector database for EcoSynk
Stores and searches trash reports and volunteer profiles
"""

import sys
import os
# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, 
    Filter, FieldCondition, MatchValue, Range,
    GeoBoundingBox, GeoPoint, GeoRadius,
    PayloadSchemaType
)

from config import settings


class EcoSynkVectorStore:
    """Qdrant vector database manager for EcoSynk"""
    
    def __init__(self, url: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize Qdrant client
        
        Args:
            url: Qdrant cluster URL (uses settings if not provided)
            api_key: Qdrant API key (uses settings if not provided)
        """
        self.url = url or settings.qdrant_url
        self.api_key = api_key or settings.qdrant_api_key
        
        if not self.url or "your-cluster" in self.url:
            raise ValueError(
                "Qdrant URL not configured. "
                "Set QDRANT_URL in your .env file"
            )
        
        if not self.api_key or self.api_key == "your_qdrant_api_key_here":
            raise ValueError(
                "Qdrant API key not configured. "
                "Set QDRANT_API_KEY in your .env file"
            )
        
        try:
            self.client = QdrantClient(
                url=self.url,
                api_key=self.api_key,
                timeout=30
            )
            print(f"✅ Connected to Qdrant at {self.url}")
        except Exception as e:
            print(f"❌ Failed to connect to Qdrant: {e}")
            raise
    
    def setup_collections(self, recreate: bool = False):
        """
        Create or recreate collections for trash reports and volunteer profiles
        
        Args:
            recreate: If True, delete and recreate collections (WARNING: deletes all data)
        """
        try:
            collections = self.client.get_collections().collections
            existing_names = [c.name for c in collections]
            
            # Trash Reports Collection
            if settings.trash_reports_collection in existing_names:
                if recreate:
                    print(f"🗑️  Deleting existing collection: {settings.trash_reports_collection}")
                    self.client.delete_collection(settings.trash_reports_collection)
                else:
                    print(f"✓ Collection already exists: {settings.trash_reports_collection}")
            
            if recreate or settings.trash_reports_collection not in existing_names:
                print(f"📦 Creating collection: {settings.trash_reports_collection}")
                self.client.create_collection(
                    collection_name=settings.trash_reports_collection,
                    vectors_config=VectorParams(
                        size=settings.embedding_dimension,
                        distance=Distance.COSINE
                    )
                )
                print(f"✅ Created: {settings.trash_reports_collection}")
            
            # Volunteer Profiles Collection
            if settings.volunteer_profiles_collection in existing_names:
                if recreate:
                    print(f"🗑️  Deleting existing collection: {settings.volunteer_profiles_collection}")
                    self.client.delete_collection(settings.volunteer_profiles_collection)
                else:
                    print(f"✓ Collection already exists: {settings.volunteer_profiles_collection}")
            
            if recreate or settings.volunteer_profiles_collection not in existing_names:
                print(f"📦 Creating collection: {settings.volunteer_profiles_collection}")
                self.client.create_collection(
                    collection_name=settings.volunteer_profiles_collection,
                    vectors_config=VectorParams(
                        size=settings.embedding_dimension,
                        distance=Distance.COSINE
                    )
                )
                print(f"✅ Created: {settings.volunteer_profiles_collection}")
                
                # Configure location field as geo-point for geographic filtering
                try:
                    self.client.create_payload_index(
                        collection_name=settings.volunteer_profiles_collection,
                        field_name="location",
                        field_schema=PayloadSchemaType.GEO
                    )
                    print(f"   ✓ Configured geo-point index for location field")
                except Exception as e:
                    print(f"   ⚠️  Could not create geo-index: {e}")
            
            print("\n🎉 All collections ready!")
            
        except Exception as e:
            print(f"❌ Error setting up collections: {e}")
            raise
    
    def store_trash_report(
        self, 
        embedding: List[float],
        metadata: Dict[str, Any],
        report_id: Optional[str] = None
    ) -> str:
        """
        Store a trash report with its vector embedding
        
        Args:
            embedding: Vector embedding of the report
            metadata: Report data (analysis results, location, etc.)
            report_id: Optional custom ID (auto-generated if not provided)
            
        Returns:
            The report ID (as string)
        """
        if report_id is None:
            report_id = str(uuid.uuid4())
        
        try:
            # Add timestamp if not present
            if 'timestamp' not in metadata:
                metadata['timestamp'] = datetime.utcnow().isoformat()
            
            # Store the report_id in metadata for retrieval
            metadata['report_id'] = report_id
            
            point = PointStruct(
                id=str(uuid.uuid4()),  # Use UUID for Qdrant
                vector=embedding,
                payload=metadata
            )
            
            self.client.upsert(
                collection_name=settings.trash_reports_collection,
                points=[point]
            )
            
            print(f"✅ Stored report: {report_id}")
            return report_id
            
        except Exception as e:
            print(f"❌ Error storing report: {e}")
            raise
    
    def find_similar_reports(
        self,
        embedding: List[float],
        limit: int = 10,
        score_threshold: float = 0.7,
        location_filter: Optional[Dict[str, Any]] = None,
        time_window_days: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Find similar trash reports (for hotspot detection)
        
        Args:
            embedding: Query vector
            limit: Maximum number of results
            score_threshold: Minimum similarity score (0-1)
            location_filter: Optional geographic filter
            time_window_days: Optional filter for recent reports
            
        Returns:
            List of similar reports with scores
        """
        try:
            query_filter = None
            
            # Build filter conditions
            if location_filter or time_window_days:
                conditions = []
                
                if time_window_days:
                    from datetime import timedelta
                    cutoff = (datetime.utcnow() - timedelta(days=time_window_days)).isoformat()
                    conditions.append(
                        FieldCondition(
                            key="timestamp",
                            range=Range(gte=cutoff)
                        )
                    )
                
                if conditions:
                    query_filter = Filter(must=conditions)
            
            results = self.client.search(
                collection_name=settings.trash_reports_collection,
                query_vector=embedding,
                limit=limit,
                score_threshold=score_threshold,
                query_filter=query_filter
            )
            
            # Format results
            formatted_results = []
            for result in results:
                formatted_results.append({
                    'id': result.id,
                    'score': result.score,
                    'data': result.payload
                })
            
            print(f"🔍 Found {len(formatted_results)} similar reports")
            return formatted_results
            
        except Exception as e:
            print(f"❌ Error searching reports: {e}")
            return []
    
    def store_volunteer_profile(
        self,
        embedding: List[float],
        profile_data: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> str:
        """
        Store a volunteer profile with vector embedding
        
        Args:
            embedding: Vector embedding of skills/experience
            profile_data: Volunteer information
            user_id: Optional custom ID (for reference in metadata)
            
        Returns:
            The user ID (as string)
        """
        if user_id is None:
            user_id = str(uuid.uuid4())
        
        try:
            # Ensure required fields
            if 'created_at' not in profile_data:
                profile_data['created_at'] = datetime.utcnow().isoformat()
            
            # Store the user_id in metadata for retrieval
            profile_data['user_id'] = user_id
            
            point = PointStruct(
                id=str(uuid.uuid4()),  # Use UUID for Qdrant
                vector=embedding,
                payload=profile_data
            )
            
            self.client.upsert(
                collection_name=settings.volunteer_profiles_collection,
                points=[point]
            )
            
            print(f"✅ Stored volunteer profile: {user_id}")
            return user_id
            
        except Exception as e:
            print(f"❌ Error storing profile: {e}")
            raise
    
    def find_nearby_volunteers(
        self,
        task_embedding: List[float],
        location: Dict[str, float],
        radius_km: float = 5.0,
        limit: int = 10,
        min_match_score: float = 0.5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Find volunteers with relevant skills near a location
        
        Args:
            task_embedding: Vector embedding of the task/cleanup needs
            location: Dict with 'lat' and 'lon' keys
            radius_km: Search radius in kilometers
            limit: Maximum number of results
            min_match_score: Minimum similarity score
            filters: Additional filters (e.g., availability)
            
        Returns:
            List of matched volunteers with scores
        """
        try:
            # Build filter conditions
            conditions = []
            
            # Geographic filter using Qdrant's geo-radius
            if location and location.get('lat') and location.get('lon'):
                try:
                    conditions.append(
                        FieldCondition(
                            key="location",
                            geo_radius=GeoRadius(
                                center=GeoPoint(
                                    lon=location['lon'],
                                    lat=location['lat']
                                ),
                                radius=radius_km * 1000  # Convert to meters
                            )
                        )
                    )
                    print(f"   Using Qdrant geo-filter: {radius_km}km radius")
                except Exception as e:
                    print(f"   ⚠️  Geo-filter failed, using post-processing: {e}")
            
            # Additional filters
            if filters:
                if filters.get('available'):
                    conditions.append(
                        FieldCondition(
                            key="available",
                            match=MatchValue(value=True)
                        )
                    )
                
                if filters.get('min_experience_level'):
                    conditions.append(
                        FieldCondition(
                            key="experience_level",
                            range=Range(gte=filters['min_experience_level'])
                        )
                    )
            
            query_filter = Filter(must=conditions) if conditions else None
            
            results = self.client.search(
                collection_name=settings.volunteer_profiles_collection,
                query_vector=task_embedding,
                limit=limit,
                score_threshold=min_match_score,
                query_filter=query_filter
            )
            
            # Format results and filter by distance (post-processing)
            import math
            
            def calculate_distance(lat1, lon1, lat2, lon2):
                """Calculate distance in km using Haversine formula"""
                R = 6371  # Earth's radius in km
                dlat = math.radians(lat2 - lat1)
                dlon = math.radians(lon2 - lon1)
                a = (math.sin(dlat/2) * math.sin(dlat/2) +
                     math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
                     math.sin(dlon/2) * math.sin(dlon/2))
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                return R * c
            
            formatted_results = []
            for result in results:
                volunteer_data = result.payload.copy()
                volunteer_data['match_score'] = result.score
                volunteer_data['user_id'] = result.id
                
                # Calculate distance if location provided
                if location and location.get('lat') and location.get('lon'):
                    vol_loc = volunteer_data.get('location', {})
                    if vol_loc.get('lat') and vol_loc.get('lon'):
                        distance = calculate_distance(
                            location['lat'], location['lon'],
                            vol_loc['lat'], vol_loc['lon']
                        )
                        volunteer_data['distance_km'] = round(distance, 2)
                        
                        # Filter by radius
                        if distance > radius_km:
                            continue
                
                formatted_results.append(volunteer_data)
            
            print(f"👥 Found {len(formatted_results)} matching volunteers")
            return formatted_results
            
        except Exception as e:
            print(f"❌ Error searching volunteers: {e}")
            return []
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about stored data"""
        try:
            reports_info = self.client.get_collection(settings.trash_reports_collection)
            volunteers_info = self.client.get_collection(settings.volunteer_profiles_collection)
            
            stats = {
                'trash_reports': {
                    'count': reports_info.points_count,
                    'vector_size': reports_info.config.params.vectors.size
                },
                'volunteers': {
                    'count': volunteers_info.points_count,
                    'vector_size': volunteers_info.config.params.vectors.size
                }
            }
            
            print("\n📊 Collection Statistics:")
            print(f"  Trash Reports: {stats['trash_reports']['count']} stored")
            print(f"  Volunteers: {stats['volunteers']['count']} profiles")
            
            return stats
            
        except Exception as e:
            print(f"❌ Error getting stats: {e}")
            return {}


# Standalone test
if __name__ == "__main__":
    print("=" * 60)
    print("Qdrant Vector Store - Test Mode")
    print("=" * 60)
    
    try:
        store = EcoSynkVectorStore()
        print("\n🔧 Setting up collections...")
        store.setup_collections(recreate=False)
        
        print("\n📊 Getting stats...")
        store.get_collection_stats()
        
        print("\n✅ Qdrant ready for use!")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        print("\nSetup steps:")
        print("1. Sign up at: https://cloud.qdrant.io/")
        print("2. Create a cluster")
        print("3. Add to .env file:")
        print("   QDRANT_URL=https://your-cluster.qdrant.io:6333")
        print("   QDRANT_API_KEY=your_api_key")

