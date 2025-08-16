from typing import Optional, List
from datetime import datetime

class User:
    """User model for MongoDB operations"""
    
    @staticmethod
    def create_user_document(
        email: str,
        name: str,
        hashed_password: str,
        profile_data: dict = None
    ) -> dict:
        """Create user document for MongoDB"""
        return {
            "email": email,
            "name": name,
            "hashed_password": hashed_password,
            "profile": profile_data or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
    
    @staticmethod
    def update_user_document(update_data: dict) -> dict:
        """Create update document for MongoDB"""
        update_data["updated_at"] = datetime.utcnow()
        return {"$set": update_data}

