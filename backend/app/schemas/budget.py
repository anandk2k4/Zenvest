from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BudgetCreate(BaseModel):
    user_id: str
    category: str
    budget_amount: float = Field(ge=0)

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    budget_amount: Optional[float] = Field(None, ge=0)

class BudgetResponse(BaseModel):
    id: str
    user_id: str
    category: str
    budget_amount: float
    spent_amount: float
    remaining: float
    percentage_spent: float
    created_at: datetime

    @classmethod
    def from_budget(cls, budget_doc: dict):
        remaining = budget_doc["budget_amount"] - budget_doc["spent_amount"]
        percentage_spent = (budget_doc["spent_amount"] / budget_doc["budget_amount"]) * 100 if budget_doc["budget_amount"] > 0 else 0
        
        return cls(
            id=str(budget_doc["_id"]),
            user_id=budget_doc["user_id"],
            category=budget_doc["category"],
            budget_amount=budget_doc["budget_amount"],
            spent_amount=budget_doc["spent_amount"],
            remaining=remaining,
            percentage_spent=round(percentage_spent, 2),
            created_at=budget_doc["created_at"]
        )

class BudgetsSummary(BaseModel):
    total_budget: float
    total_spent: float
    total_remaining: float
    budgets: list[BudgetResponse]
