from datetime import datetime
from bson import ObjectId
from fastapi import Depends

from app.models.budget import IncomeCreate, IncomeUpdate, IncomeResponse, MessageResponse
from app.db import get_database  # ✅ use dependency instead of global _db
from motor.motor_asyncio import AsyncIOMotorDatabase


class IncomeService:
    def __init__(self, db: AsyncIOMotorDatabase = Depends(get_database)):
        self.db = db

    async def add_income(self, income: IncomeCreate, user_id: str) -> IncomeResponse:
        doc = {
            "user_id": user_id,
            "budget_id": income.budget_id,
            "amount": income.amount,
            "source": income.source,
            "type": income.type.value,
            "description": income.description,
            "date": income.date,
            "created_at": datetime.utcnow(),
        }
        result = await self.db.income.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return IncomeResponse(**doc)

    async def get_income(self, user_id: str, budget_id: str = None):
        query = {"user_id": user_id}
        if budget_id:
            query["budget_id"] = budget_id

        cursor = self.db.income.find(query)
        items = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            items.append(IncomeResponse(**doc))
        return items

    async def update_income(self, income_id: str, income: IncomeUpdate, user_id: str):
        update_data = {k: v for k, v in income.dict(exclude_unset=True).items()}
        result = await self.db.income.find_one_and_update(
            {"_id": ObjectId(income_id), "user_id": user_id},
            {"$set": update_data},
            return_document=True,
        )
        if not result:
            return None
        result["_id"] = str(result["_id"])
        return IncomeResponse(**result)

    async def delete_income(self, income_id: str, user_id: str) -> MessageResponse:
        result = await self.db.income.delete_one(
            {"_id": ObjectId(income_id), "user_id": user_id}
        )
        if result.deleted_count == 0:
            return MessageResponse(message="Income not found", success=False)
        return MessageResponse(message="Income deleted successfully")
