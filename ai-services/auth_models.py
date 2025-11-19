from pydantic import BaseModel, Field
from typing import Optional, List

class UserRegisterRequest(BaseModel):
    """Request model for user registration"""
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    interests: Optional[List[str]] = Field(default_factory=list)
    skills: Optional[List[str]] = Field(default_factory=list)
    experience_level: Optional[str] = Field(default="beginner")

class UserLoginRequest(BaseModel):
    """Request model for user login"""
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6, max_length=100)

class UserUpdateRequest(BaseModel):
    """Request model for user profile updates"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    interests: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    profile_picture_url: Optional[str] = None

class FollowUserRequest(BaseModel):
    """Request model for following a user"""
    followee_name: str = Field(..., min_length=2, max_length=100, description="Name of the user to follow")

class UnfollowUserRequest(BaseModel):
    """Request model for unfollowing a user"""
    followee_id: str = Field(..., description="User ID to unfollow")