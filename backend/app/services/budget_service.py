from ..db import get_database
from ..schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetsSummary
from bson import ObjectId
from datetime import datetime
from typing import Optional, List

class BudgetService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.budgets

    async def create_budget(self, budget: BudgetCreate) -> BudgetResponse:
        # Check if budget category already exists for user
        existing = await self.collection.find_one({
            "user_id": budget.user_id,
            "category": budget.category
        })
        
        if existing:
            raise ValueError("Budget category already exists for this user")

        budget_doc = {
            "user_id": budget.user_id,
            "category": budget.category,
            "budget_amount": budget.budget_amount,
            "spent_amount": 0.0,
            "created_at": datetime.utcnow()
        }

        result = await self.collection.insert_one(budget_doc)
        budget_doc["_id"] = result.inserted_id

        return BudgetResponse.from_budget(budget_doc)

    async def get_user_budgets(self, user_id: str) -> BudgetsSummary:
        cursor = self.collection.find({"user_id": user_id})
        budgets = []
        total_budget = 0.0
        total_spent = 0.0

        async for budget_doc in cursor:
            budget_response = BudgetResponse.from_budget(budget_doc)
            budgets.append(budget_response)
            total_budget += budget_response.budget_amount
            total_spent += budget_response.spent_amount

        return BudgetsSummary(
            total_budget=total_budget,
            total_spent=total_spent,
            total_remaining=total_budget - total_spent,
            budgets=budgets
        )

    async def update_budget(self, budget_id: str, budget_update: BudgetUpdate) -> Optional[BudgetResponse]:
        update_data = {k: v for k, v in budget_update.dict().items() if v is not None}
        
        if not update_data:
            return None

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(budget_id)},
            {"$set": update_data},
            return_document=True
        )

        if result:
            return BudgetResponse.from_budget(result)
        return None

    async def delete_budget(self, budget_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(budget_id)})
        return result.deleted_count > 0

    async def update_spent_amount(self, user_id: str, category: str, amount: float):
        await self.collection.update_one(
            {"user_id": user_id, "category": category},
            {"$inc": {"spent_amount": amount}}
        )