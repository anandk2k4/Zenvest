from app.models.budget import ExpenseCreate, ExpenseUpdate, ExpenseResponse, MessageResponse
from app.db import get_database  # ✅ use dependency instead of global _db
from motor.motor_asyncio import AsyncIOMotorDatabase

from datetime import datetime
from bson import ObjectId
from fastapi import Depends

class ExpenseService:
    def __init__(self, db: AsyncIOMotorDatabase = Depends(get_database)):
        self.db = db
        
    async def add_expense(self, expense: ExpenseCreate, user_id: str) -> ExpenseResponse:
        doc = {
            "user_id": user_id,
            "budget_id": expense.budget_id,
            "amount": expense.amount,
            "category": expense.category.value,
            "description": expense.description,
            "date": expense.date,
            "created_at": datetime.utcnow()
        }
        result = await self.db.expenses.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return ExpenseResponse(**doc)

    async def get_expenses(self, user_id: str, budget_id: str = None):
        query = {"user_id": user_id}
        if budget_id:
            query["budget_id"] = budget_id
        cursor = self.db.expenses.find(query)
        items = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            items.append(ExpenseResponse(**doc))
        return items

    async def update_expense(self, expense_id: str, expense: ExpenseUpdate, user_id: str):
        update_data = {k: v for k, v in expense.dict(exclude_unset=True).items()}
        result = await self.db.expenses.find_one_and_update(
            {"_id": ObjectId(expense_id), "user_id": user_id},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            return None
        result["_id"] = str(result["_id"])
        return ExpenseResponse(**result)

    async def delete_expense(self, expense_id: str, user_id: str) -> MessageResponse:
        result = await self.db.expenses.delete_one({"_id": ObjectId(expense_id), "user_id": user_id})
        if result.deleted_count == 0:
            return MessageResponse(message="Expense not found", success=False)
        return MessageResponse(message="Expense deleted successfully")
