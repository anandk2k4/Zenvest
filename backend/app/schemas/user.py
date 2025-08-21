from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserProfile

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    profile: Optional[UserProfile] = None

class UserResponse(BaseModel):
    id: str
    clerk_user_id: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    profile: Optional[UserProfile] = None
    is_active: bool
    
    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    age: Optional[int] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    dependents: Optional[int] = None
