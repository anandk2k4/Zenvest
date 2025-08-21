from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from datetime import datetime

class GoalService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.collection = database.goals

    async def create_goal(self, clerk_user_id: str, goal_data: GoalCreate) -> GoalResponse:
        goal = Goal(
            clerk_user_id=clerk_user_id,
            **goal_data.dict()
        )
        
        result = await self.collection.insert_one(goal.dict(by_alias=True))
        created_goal = await self.collection.find_one({"_id": result.inserted_id})
        
        return self._format_goal_response(created_goal)

    async def get_user_goals(self, clerk_user_id: str) -> List[GoalResponse]:
        cursor = self.collection.find({"clerk_user_id": clerk_user_id})
        goals = await cursor.to_list(length=None)
        
        return [self._format_goal_response(goal) for goal in goals]

    async def get_goal_by_id(self, goal_id: str, clerk_user_id: str) -> Optional[GoalResponse]:
        goal = await self.collection.find_one({
            "_id": ObjectId(goal_id),
            "clerk_user_id": clerk_user_id
        })
        
        if goal:
            return self._format_goal_response(goal)
        return None

    async def update_goal(self, goal_id: str, clerk_user_id: str, update_data: GoalUpdate) -> Optional[GoalResponse]:
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.update_one(
            {"_id": ObjectId(goal_id), "clerk_user_id": clerk_user_id},
            {"$set": update_dict}
        )
        
        if result.modified_count:
            updated_goal = await self.collection.find_one({"_id": ObjectId(goal_id)})
            return self._format_goal_response(updated_goal)
        return None

    async def delete_goal(self, goal_id: str, clerk_user_id: str) -> bool:
        result = await self.collection.delete_one({
            "_id": ObjectId(goal_id),
            "clerk_user_id": clerk_user_id
        })
        return result.deleted_count > 0

    def _format_goal_response(self, goal_doc: dict) -> GoalResponse:
        targetAmount = goal_doc.get("targetAmount") or 0
        currentAmount = goal_doc.get("currentAmount") or 0

    # Avoid division by zero
        if targetAmount > 0:
            progress_percentage = (currentAmount / targetAmount) * 100
        else:
            progress_percentage = 0

        return GoalResponse(
            id=str(goal_doc["_id"]),
            title=goal_doc.get("title"),
            category=goal_doc.get("category"),
            target_amount=targetAmount,
            current_amount=currentAmount,  # ✅ fixed (camelCase used)
            duration=goal_doc.get("duration"),
            description=goal_doc.get("description"),
            created_at=goal_doc.get("created_at") or datetime.utcnow(),  # ✅ safe fetch
            progress_percentage=round(progress_percentage, 2),
        )

