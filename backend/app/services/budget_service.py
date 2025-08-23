from app.models.budget import BudgetCreate, BudgetUpdate, BudgetResponse, MessageResponse
from app.db import get_database  
from motor.motor_asyncio import AsyncIOMotorDatabase

from datetime import datetime
from bson import ObjectId
from fastapi import Depends

class BudgetService:
    def __init__(self, db: AsyncIOMotorDatabase = Depends(get_database)):
        self.db = db
        
    async def create_budget(self, budget: BudgetCreate, user_id: str) -> BudgetResponse:
        budget_doc = {
            "user_id": user_id,
            "name": budget.name,
            "total_income": budget.total_income,
            "period": budget.period.value,
            "category_limits": {k.value: v for k, v in budget.category_limits.items()},
            "savings_goal": budget.savings_goal,
            "description": budget.description,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await self.db.budgets.insert_one(budget_doc)
        budget_doc["_id"] = str(result.inserted_id)
        return BudgetResponse(**budget_doc)

    async def get_user_budgets(self, user_id: str):
        cursor = self.db.budgets.find({"user_id": user_id})
        budgets = []
        async for b in cursor:
            b["_id"] = str(b["_id"])
            budgets.append(BudgetResponse(**b))
        return budgets

    async def get_budget(self, budget_id: str, user_id: str):
        doc = await self.db.budgets.find_one({"_id": ObjectId(budget_id), "user_id": user_id})
        if not doc:
            return None
        doc["_id"] = str(doc["_id"])
        return BudgetResponse(**doc)

    async def update_budget(self, budget_id: str, budget: BudgetUpdate, user_id: str):
        update_data = {k: v for k, v in budget.dict(exclude_unset=True).items()}
        if "category_limits" in update_data:
            update_data["category_limits"] = {k.value: v for k, v in update_data["category_limits"].items()}
        update_data["updated_at"] = datetime.utcnow()

        result = await self.db.budgets.find_one_and_update(
            {"_id": ObjectId(budget_id), "user_id": user_id},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            return None
        result["_id"] = str(result["_id"])
        return BudgetResponse(**result)

    async def delete_budget(self, budget_id: str, user_id: str) -> MessageResponse:
        result = await self.db.budgets.delete_one({"_id": ObjectId(budget_id), "user_id": user_id})
        if result.deleted_count == 0:
            return MessageResponse(message="Budget not found", success=False)
        return MessageResponse(message="Budget deleted successfully")
