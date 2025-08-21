from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.models.goal import PyObjectId

class UserProfile(BaseModel):
    age: int
    monthly_income: float
    monthly_expenses: float
    dependents: int = 0

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    clerk_user_id: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    profile: Optional[UserProfile] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
