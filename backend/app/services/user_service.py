from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.user import User
from app.schemas.user import UserUpdate, UserResponse
from bson import ObjectId

class UserService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.collection = database.users

    async def get_or_create_user(self, clerk_user_id: str, email: str = None, full_name: str = None) -> UserResponse:
        """Get existing user or create new user with Clerk ID"""
        # Check if user already exists
        existing_user = await self.collection.find_one({"clerk_user_id": clerk_user_id})
        if existing_user:
            return self._format_user_response(existing_user)

        # Create new user
        user = User(
            clerk_user_id=clerk_user_id,
            email=email,
            full_name=full_name
        )
        
        result = await self.collection.insert_one(user.dict(by_alias=True))
        created_user = await self.collection.find_one({"_id": result.inserted_id})
        
        return self._format_user_response(created_user)

    async def get_user_by_clerk_id(self, clerk_user_id: str) -> Optional[UserResponse]:
        """Get user by Clerk user ID"""
        user = await self.collection.find_one({"clerk_user_id": clerk_user_id})
        if user:
            return self._format_user_response(user)
        return None

    async def update_user(self, clerk_user_id: str, update_data: UserUpdate) -> Optional[UserResponse]:
        """Update user profile by Clerk user ID"""
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        result = await self.collection.update_one(
            {"clerk_user_id": clerk_user_id},
            {"$set": update_dict}
        )
        
        if result.modified_count:
            updated_user = await self.collection.find_one({"clerk_user_id": clerk_user_id})
            return self._format_user_response(updated_user)
        return None

    def _format_user_response(self, user_doc: dict) -> UserResponse:
        return UserResponse(
            id=str(user_doc["_id"]),
            clerk_user_id=user_doc["clerk_user_id"],
            email=user_doc.get("email"),
            full_name=user_doc.get("full_name"),
            profile=user_doc.get("profile"),
            is_active=user_doc["is_active"]
        )
