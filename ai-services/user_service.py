from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, PayloadSchemaType
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
            collection_exists = self.collection_name in [c.name for c in collections.collections]
            
            if not collection_exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
                )
            
            # Create payload index for email field (required for filtering)
            try:
                from qdrant_client.models import PayloadSchemaType
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="email",
                    field_schema=PayloadSchemaType.KEYWORD
                )
                print(f"Created payload index for 'email' field in {self.collection_name}")
            except Exception as idx_error:
                # Index might already exist, which is fine
                if "already exists" not in str(idx_error).lower():
                    print(f"Note: Could not create email index: {idx_error}")
                    
        except Exception as e:
            print(f"Error creating collection: {e}")
    
    def _hash_password(self, password: str) -> str:
        """Hash password with salt"""
        salt = "ecosynk_salt"
        return hashlib.sha256((password + salt).encode()).hexdigest()
    
    def _generate_user_vector(self, user_data: Dict[str, Any]) -> list:
        """Generate user profile vector from user data
        
        Supports both user and volunteer data structures:
        - User: name, bio, interests, skills
        - Volunteer: name, bio, skills, materials_expertise, specializations
        """
        name = user_data.get('name', '')
        bio = user_data.get('bio', '')
        
        # Combine interests (users) with skills/specializations (volunteers/users)
        interests = user_data.get('interests', [])
        skills = user_data.get('skills', [])
        materials = user_data.get('materials_expertise', [])
        specializations = user_data.get('specializations', [])
        
        all_keywords = interests + skills + materials + specializations
        keywords_text = ' '.join(all_keywords) if all_keywords else ''
        
        profile_text = f"{name} {bio} {keywords_text}"
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
                ids=[user_id],
                with_vectors=True
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
            full_point = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[user_id],
                with_vectors=True
            )[0]
            full_user = full_point.payload
            
            # Update user data
            full_user.update(updates)
            full_user["updated_at"] = datetime.datetime.utcnow().isoformat()
            
            # Regenerate vector if profile-relevant data changed
            if any(key in updates for key in ['name', 'bio', 'interests', 'skills']):
                user_vector = self._generate_user_vector(full_user)
            else:
                # Keep existing vector (regenerate if missing)
                user_vector = full_point.vector or self._generate_user_vector(full_user)
            
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
                ids=[user_id],
                with_vectors=True
            )
            
            if not current_user:
                return {"success": False, "error": "User not found"}
            
            user_vector = current_user[0].vector
            if user_vector is None:
                user_vector = self._generate_user_vector(current_user[0].payload)
            
            # Search for similar users
            search_result = self.client.query_points(
                collection_name=self.collection_name,
                query=user_vector,
                limit=limit + 1,  # +1 to exclude self
                score_threshold=0.3
            ).points
            
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
                ids=[user_id],
                with_vectors=True
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
            
            # Update in Qdrant (regenerate vector if missing)
            current_vector = current_user[0].vector or self._generate_user_vector(user_data)
            point = PointStruct(
                id=user_id,
                vector=current_vector,
                payload=user_data
            )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            return {"success": True, "stats": current_stats}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def follow_user(self, follower_id: str, followee_name: str) -> Dict[str, Any]:
        """Follow another user by their name"""
        try:
            # Get follower user
            follower = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[follower_id],
                with_vectors=True
            )
            
            if not follower:
                return {"success": False, "error": "Follower user not found"}
            
            # Find user to follow by name
            search_result = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter={
                    "must": [
                        {"key": "name", "match": {"value": followee_name}}
                    ]
                },
                limit=1
            )
            
            if not search_result[0]:
                return {"success": False, "error": f"User '{followee_name}' not found"}
            
            followee = search_result[0][0]
            followee_id = followee.id
            
            # Can't follow yourself
            if follower_id == followee_id:
                return {"success": False, "error": "Cannot follow yourself"}
            
            # Get current following lists
            follower_data = follower[0].payload
            followee_data = followee.payload
            
            following_list = follower_data.get("following", [])
            followers_list = followee_data.get("followers", [])
            
            # Check if already following
            if followee_id in following_list:
                return {"success": False, "error": f"Already following {followee_name}"}
            
            # Update following and followers lists
            following_list.append(followee_id)
            followers_list.append(follower_id)
            
            follower_data["following"] = following_list
            followee_data["followers"] = followers_list
            
            # Update both users in Qdrant
            follower_vector = follower[0].vector or self._generate_user_vector(follower_data)
            followee_vector = followee.vector or self._generate_user_vector(followee_data)

            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=follower_id,
                        vector=follower_vector,
                        payload=follower_data
                    ),
                    PointStruct(
                        id=followee_id,
                        vector=followee_vector,
                        payload=followee_data
                    )
                ]
            )
            
            return {
                "success": True,
                "message": f"Now following {followee_name}",
                "followee": {k: v for k, v in followee_data.items() if k != "password_hash"}
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def unfollow_user(self, follower_id: str, followee_id: str) -> Dict[str, Any]:
        """Unfollow a user"""
        try:
            # Get both users
            users = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[follower_id, followee_id],
                with_vectors=True
            )
            
            if len(users) != 2:
                return {"success": False, "error": "One or both users not found"}
            
            follower = users[0] if users[0].id == follower_id else users[1]
            followee = users[1] if users[0].id == follower_id else users[0]
            
            follower_data = follower.payload
            followee_data = followee.payload
            
            following_list = follower_data.get("following", [])
            followers_list = followee_data.get("followers", [])
            
            # Remove from lists
            if followee_id in following_list:
                following_list.remove(followee_id)
            if follower_id in followers_list:
                followers_list.remove(follower_id)
            
            follower_data["following"] = following_list
            followee_data["followers"] = followers_list
            
            # Update both users
            follower_vector = follower.vector or self._generate_user_vector(follower_data)
            followee_vector = followee.vector or self._generate_user_vector(followee_data)

            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=follower_id,
                        vector=follower_vector,
                        payload=follower_data
                    ),
                    PointStruct(
                        id=followee_id,
                        vector=followee_vector,
                        payload=followee_data
                    )
                ]
            )
            
            return {
                "success": True,
                "message": f"Unfollowed {followee_data.get('name', 'user')}"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_recommended_users(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """Get personalized user recommendations using vector similarity
        
        Recommendation factors:
        1. Interest/skill similarity (vector similarity)
        2. Experience level compatibility (similar or slightly higher)
        3. Activity overlap (common cities/campaigns)
        4. Engagement level (active users prioritized)
        5. Not already following
        """
        try:
            current_user = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[user_id],
                with_vectors=True
            )
            
            if not current_user:
                return {"success": False, "error": "User not found"}
            
            user_data = current_user[0].payload
            user_vector = current_user[0].vector
            if user_vector is None:
                user_vector = self._generate_user_vector(user_data)
            following_list = user_data.get("following", [])
            user_experience = user_data.get("experience_level", "beginner")
            
            # Support both user and volunteer data structures
            user_interests = set(user_data.get("interests", []))
            user_skills = set(user_data.get("skills", []))
            user_materials = set(user_data.get("materials_expertise", []))
            user_specializations = set(user_data.get("specializations", []))
            user_city = user_data.get("city", "")
            
            # Search for similar users using vector similarity
            search_result = self.client.query_points(
                collection_name=self.collection_name,
                query=user_vector,
                limit=50,  # Get more candidates for filtering
                score_threshold=0.2
            ).points
            
            # Experience level weights for compatibility
            exp_levels = {
                "beginner": 1,
                "intermediate": 2,
                "advanced": 3,
                "expert": 4
            }
            
            recommendations = []
            for result in search_result:
                candidate_id = result.id
                
                # Skip self and already following
                if candidate_id == user_id or candidate_id in following_list:
                    continue
                
                candidate = result.payload
                candidate_score = result.score
                
                # Calculate recommendation score based on multiple factors
                factors = {
                    "vector_similarity": candidate_score * 100,  # 0-100 scale
                    "experience_compatibility": 0,
                    "common_interests": 0,
                    "common_skills": 0,
                    "common_materials": 0,
                    "common_specializations": 0,
                    "location_match": 0,
                    "activity_level": 0
                }
                
                # Experience compatibility (prefer similar or slightly higher)
                candidate_exp = candidate.get("experience_level", "beginner")
                exp_diff = abs(exp_levels.get(candidate_exp, 1) - exp_levels.get(user_experience, 1))
                factors["experience_compatibility"] = max(0, 15 - (exp_diff * 4))
                
                # Common interests (user-specific)
                candidate_interests = set(candidate.get("interests", []))
                if candidate_interests and user_interests:
                    common_interests = len(user_interests & candidate_interests)
                    factors["common_interests"] = min(15, common_interests * 5)
                
                # Common skills (both users and volunteers)
                candidate_skills = set(candidate.get("skills", []))
                if candidate_skills and user_skills:
                    common_skills = len(user_skills & candidate_skills)
                    factors["common_skills"] = min(15, common_skills * 3)
                
                # Common materials expertise (volunteer-specific but valuable for collaboration)
                candidate_materials = set(candidate.get("materials_expertise", []))
                if candidate_materials and user_materials:
                    common_materials = len(user_materials & candidate_materials)
                    factors["common_materials"] = min(10, common_materials * 5)
                
                # Common specializations (volunteer-specific)
                candidate_specializations = set(candidate.get("specializations", []))
                if candidate_specializations and user_specializations:
                    common_spec = len(user_specializations & candidate_specializations)
                    factors["common_specializations"] = min(10, common_spec * 5)
                
                # Same city bonus
                candidate_city = candidate.get("city", "")
                if user_city and candidate_city == user_city:
                    factors["location_match"] = 15
                
                # Activity level (use past_cleanup_count for volunteers, stats for users)
                past_cleanups = candidate.get("past_cleanup_count", 0)
                candidate_stats = candidate.get("stats", {})
                campaigns_joined = candidate_stats.get("campaigns_joined", 0)
                total_cleanups = candidate.get("total_cleanups", past_cleanups)
                activity_score = min(10, (campaigns_joined * 2 + total_cleanups) / 5)
                factors["activity_level"] = activity_score
                
                # Calculate final score (weighted sum)
                final_score = (
                    factors["vector_similarity"] * 0.30 +          # 30% weight on semantic similarity
                    factors["experience_compatibility"] * 0.10 +    # 10% on experience match
                    factors["common_interests"] * 0.15 +           # 15% on shared interests
                    factors["common_skills"] * 0.15 +              # 15% on shared skills
                    factors["common_materials"] * 0.08 +           # 8% on materials expertise
                    factors["common_specializations"] * 0.07 +     # 7% on specializations
                    factors["location_match"] * 0.10 +             # 10% on location
                    factors["activity_level"] * 0.05               # 5% on activity
                )
                
                # Remove sensitive data
                candidate_clean = {k: v for k, v in candidate.items() if k != "password_hash"}
                candidate_clean["recommendation_score"] = round(final_score, 2)
                candidate_clean["recommendation_factors"] = {
                    k: round(v, 2) for k, v in factors.items()
                }
                candidate_clean["user_id"] = candidate_id
                
                recommendations.append(candidate_clean)
            
            # Sort by final score and limit results
            recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
            top_recommendations = recommendations[:limit]
            
            return {
                "success": True,
                "recommendations": top_recommendations,
                "total_candidates": len(recommendations)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def search_users(self, query: str, limit: int = 20) -> Dict[str, Any]:
        """Search users by name or email"""
        try:
            normalized_query = (query or "").strip()
            if not normalized_query:
                return {"success": True, "users": []}

            query_lower = normalized_query.lower()
            matching_users = []
            seen_ids = set()

            # Exact-ish matches via scroll (name/email contains query)
            scroll_result = self.client.scroll(
                collection_name=self.collection_name,
                limit=limit * 2
            )

            for user in scroll_result[0]:
                user_data = user.payload
                name = user_data.get("name", "").lower()
                email = user_data.get("email", "").lower()

                if query_lower in name or query_lower in email:
                    user_clean = {k: v for k, v in user_data.items() if k != "password_hash"}
                    user_clean["user_id"] = user.id
                    user_clean["match_type"] = "keyword"
                    user_clean["match_score"] = 100.0
                    matching_users.append(user_clean)
                    seen_ids.add(user.id)

            # Semantic match using embeddings to surface similar expertise/interests
            try:
                query_vector = self.model.encode(normalized_query).tolist()
                vector_threshold = 0.2 if len(normalized_query) >= 3 else 0.1
                vector_results = self.client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    limit=limit * 2,
                    score_threshold=vector_threshold
                ).points

                for result in vector_results:
                    if result.id in seen_ids:
                        continue

                    payload = result.payload or {}
                    user_clean = {k: v for k, v in payload.items() if k != "password_hash"}
                    user_clean["user_id"] = result.id
                    user_clean["match_type"] = "semantic"
                    user_clean["match_score"] = round((result.score or 0) * 100, 2)
                    matching_users.append(user_clean)
                    seen_ids.add(result.id)
            except Exception as semantic_error:
                print(f"Semantic search fallback due to error: {semantic_error}")

            # Order by match score descending and trim to limit
            matching_users.sort(key=lambda item: item.get("match_score", 0), reverse=True)

            return {
                "success": True,
                "users": matching_users[:limit]
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}