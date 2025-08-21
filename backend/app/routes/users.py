from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.schemas.user import UserUpdate, UserResponse
from app.services.user_service import UserService
from app.auth.clerk import get_clerk_user_id

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/profile", response_model=UserResponse)
async def get_profile(
    clerk_user_id: str = Depends(get_clerk_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get or create user profile based on Clerk user ID"""
    user_service = UserService(db)
    user = await user_service.get_or_create_user(clerk_user_id)
    return user

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    clerk_user_id: str = Depends(get_clerk_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update user profile"""
    user_service = UserService(db)
    updated_user = await user_service.update_user(clerk_user_id, update_data)
    
    if not updated_user:
        # If user doesn't exist, create them first
        user = await user_service.get_or_create_user(clerk_user_id)
        updated_user = await user_service.update_user(clerk_user_id, update_data)
    
    return updated_user
