from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import hashlib
import jwt
import datetime
from typing import Optional, Dict, Any
import uuid
from sentence_transformers import SentenceTransformer
import os

class UserService:
    def __init__(self):
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY")
        )
        self.collection_name = "users"
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.jwt_secret = os.getenv("JWT_SECRET", "ecosynk_secret_key")
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Create users collection if it doesn't exist"""
        try:
            collections = self.client.get_collections()
            if self.collection_name not in [c.name for c in collections.collections]:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
                )
        except Exception as e:
            print(f"Error creating collection: {e}")
    
    def _hash_password(self, password: str) -> str:
        """Hash password with salt"""
        salt = "ecosynk_salt"
        return hashlib.sha256((password + salt).encode()).hexdigest()
    
    def _generate_user_vector(self, user_data: Dict[str, Any]) -> list:
        """Generate user profile vector from user data"""
        profile_text = f"{user_data.get('name', '')} {user_data.get('bio', '')} {' '.join(user_data.get('interests', []))}"
        return self.model.encode(profile_text).tolist()
    
    def _generate_jwt(self, user_id: str) -> str:
        """Generate JWT token for user"""
        payload = {
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')
    
    def verify_jwt(self, token: str) -> Optional[str]:
        """Verify JWT token and return user_id"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return payload['user_id']
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def register_user(self, name: str, email: str, password: str, **kwargs) -> Dict[str, Any]:
        """Register new user"""
        try:
            # Check if user already exists
            existing = self.get_user_by_email(email)
            if existing:
                return {"success": False, "error": "User already exists"}
            
            user_id = str(uuid.uuid4())
            hashed_password = self._hash_password(password)
            
            user_data = {
                "user_id": user_id,
                "name": name,
                "email": email,
                "password_hash": hashed_password,
                "created_at": datetime.datetime.utcnow().isoformat(),
                "bio": kwargs.get("bio", ""),
                "location": kwargs.get("location", ""),
                "city": kwargs.get("city", ""),
                "country": kwargs.get("country", ""),
                "interests": kwargs.get("interests", []),
                "skills": kwargs.get("skills", []),
                "experience_level": kwargs.get("experience_level", "beginner"),
                "total_cleanups": 0,
                "total_points": 0,
                "level": 1,
                "achievements": [],
                "following": [],
                "followers": [],
                "profile_picture_url": kwargs.get("profile_picture_url", ""),
                "stats": {
                    "campaigns_joined": 0,
                    "campaigns_created": 0,
                    "donations_made": 0,
                    "total_area_cleaned_sqm": 0,
                    "total_co2_saved_kg": 0,
                    "most_common_city": "None",
                    "cities_worked_in": 0,
                    "individual_reports": 0
                }
            }
            
            # Generate user vector
            user_vector = self._generate_user_vector(user_data)
            
            # Store in Qdrant
            point = PointStruct(
                id=user_id,
                vector=user_vector,
                payload=user_data
            )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            # Generate JWT token
            token = self._generate_jwt(user_id)
            
            # Remove sensitive data from response
            user_response = {k: v for k, v in user_data.items() if k != "password_hash"}
            
            return {
                "success": True,
                "user": user_response,
                "token": token
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login user"""
        try:
            user = self.get_user_by_email(email)
            if not user:
                return {"success": False, "error": "User not found"}
            
            hashed_password = self._hash_password(password)
            if user["password_hash"] != hashed_password:
                return {"success": False, "error": "Invalid password"}
            
            # Generate JWT token
            token = self._generate_jwt(user["user_id"])
            
            # Remove sensitive data from response
            user_response = {k: v for k, v in user.items() if k != "password_hash"}
            
            return {
                "success": True,
                "user": user_response,
                "token": token
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            search_result = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter={
                    "must": [
                        {"key": "email", "match": {"value": email}}
                    ]
                },
                limit=1
            )
            
            if search_result[0]:
                return search_result[0][0].payload
            return None
            
        except Exception as e:
            print(f"Error getting user by email: {e}")
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            result = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[user_id]
            )
            
            if result:
                user_data = result[0].payload
                # Remove sensitive data
                return {k: v for k, v in user_data.items() if k != "password_hash"}
            return None
            
        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None
    
    def update_user(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile"""
        try:
            current_user = self.get_user_by_id(user_id)
            if not current_user:
                return {"success": False, "error": "User not found"}
            
            # Get full user data including password hash
            full_user = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[user_id]
            )[0].payload
            
            # Update user data
            full_user.update(updates)
            full_user["updated_at"] = datetime.datetime.utcnow().isoformat()
            
            # Regenerate vector if profile-relevant data changed
            if any(key in updates for key in ['name', 'bio', 'interests', 'skills']):
                user_vector = self._generate_user_vector(full_user)
            else:
                # Keep existing vector
                user_vector = self.client.retrieve(
                    collection_name=self.collection_name,
                    ids=[user_id]
                )[0].vector
            
            # Update in Qdrant
            point = PointStruct(
                id=user_id,
                vector=user_vector,
                payload=full_user
            )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            # Return updated user without sensitive data
            user_response = {k: v for k, v in full_user.items() if k != "password_hash"}
            
            return {
                "success": True,
                "user": user_response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def find_similar_users(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """Find users with similar interests/profiles"""
        try:
            current_user = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[user_id]
            )
            
            if not current_user:
                return {"success": False, "error": "User not found"}
            
            user_vector = current_user[0].vector
            
            # Search for similar users
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=user_vector,
                limit=limit + 1,  # +1 to exclude self
                score_threshold=0.3
            )
            
            # Filter out the current user and format results
            similar_users = []
            for result in search_result:
                if result.id != user_id:
                    user_data = {k: v for k, v in result.payload.items() if k != "password_hash"}
                    user_data["similarity_score"] = result.score
                    similar_users.append(user_data)
            
            return {
                "success": True,
                "similar_users": similar_users[:limit]
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_user_stats(self, user_id: str, stat_updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user activity statistics"""
        try:
            current_user = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[user_id]
            )
            
            if not current_user:
                return {"success": False, "error": "User not found"}
            
            user_data = current_user[0].payload
            current_stats = user_data.get("stats", {})
            
            # Update stats
            for key, value in stat_updates.items():
                if key in current_stats:
                    if isinstance(value, (int, float)):
                        current_stats[key] += value
                    else:
                        current_stats[key] = value
            
            user_data["stats"] = current_stats
            user_data["updated_at"] = datetime.datetime.utcnow().isoformat()
            
            # Update in Qdrant
            point = PointStruct(
                id=user_id,
                vector=current_user[0].vector,
                payload=user_data
            )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            return {"success": True, "stats": current_stats}
            
        except Exception as e:
            return {"success": False, "error": str(e)}