from typing import List, Optional, Tuple
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.goal import Goal, GoalCreate, GoalUpdate, AIAdviceRequest, AIAdviceResponse, GoalType
from app.core.config import settings
import os
import google.generativeai as genai

class GoalService:
    def __init__(self, db):
        if db is None:
            raise ValueError("Database connection is None — check MongoDB setup.")
        self.collection = db["goals"]

    async def create_goal(self, goal_data: GoalCreate) -> str:
        doc = goal_data.model_dump()
        doc["created_at"] = datetime.utcnow()
        res = await self.collection.insert_one(doc)
        return str(res.inserted_id)

    async def get_goal_by_id(self, goal_id: str, user_id: str) -> Optional[Goal]:
        if not ObjectId.is_valid(goal_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(goal_id), "user_id": user_id})
        if not doc:
            return None
        doc["id"] = str(doc["_id"])
        return Goal(**doc)

    async def get_goals_by_user(
        self, user_id: str, skip: int = 0, limit: int = 100, goal_type: Optional[str] = None
    ) -> Tuple[List[Goal], int]:
        q = {"user_id": user_id}
        if goal_type:
            q["goal_type"] = goal_type
        cursor = self.collection.find(q).skip(skip).limit(limit).sort("created_at", -1)
        goals: List[Goal] = []
        async for d in cursor:
            d["id"] = str(d["_id"])
            goals.append(Goal(**d))
        total = await self.collection.count_documents(q)
        return goals, total

    async def update_goal(self, goal_id: str, user_id: str, goal_update: GoalUpdate) -> bool:
        if not ObjectId.is_valid(goal_id):
            return False
        data = goal_update.model_dump(exclude_unset=True)
        if not data:
            return False
        data["updated_at"] = datetime.utcnow()
        res = await self.collection.update_one({"_id": ObjectId(goal_id), "user_id": user_id}, {"$set": data})
        return res.matched_count > 0

    async def delete_goal(self, goal_id: str, user_id: str) -> bool:
        if not ObjectId.is_valid(goal_id):
            return False
        res = await self.collection.delete_one({"_id": ObjectId(goal_id), "user_id": user_id})
        return res.deleted_count > 0


class AIAdvisorService:
    # ---------- Core math & checks ----------
    @staticmethod
    def calculate_months(value: int, unit: str) -> int:
        return value if unit == "months" else value * 12

    @staticmethod
    def calculate_monthly_savings(target_amount: float, current_savings: float, months: int) -> float:
        remaining = max(0, target_amount - current_savings)
        return remaining / months if months > 0 else remaining

    @staticmethod
    def needs_clarification(req: AIAdviceRequest) -> tuple[bool, list[str]]:
        qs: list[str] = []
        if req.goal_type == GoalType.OTHER and not req.description:
            qs.append("Could you describe your goal in a bit more detail?")
        months = AIAdvisorService.calculate_months(req.time_frame.value, req.time_frame.unit)
        monthly = AIAdvisorService.calculate_monthly_savings(req.target_amount, req.current_savings, months)
        if req.goal_type == GoalType.HOUSE and req.target_amount < 1_000_000:
            qs.append("Is this target for down payment or full property value?")
        if monthly > 100_000:
            qs.append("The required monthly savings looks high. Would you extend the timeline or lower the target?")
        if months < 6 and req.target_amount > 500_000:
            qs.append("The timeline seems very short for this target. Can you extend it or add funding sources?")
        return (len(qs) > 0, qs)

    @staticmethod
    def check_feasibility(monthly_savings: float, monthly_income: float | None, monthly_expenses: float | None) -> str:
        if monthly_income is not None and monthly_expenses is not None:
            available = monthly_income - monthly_expenses
            if available <= 0:
                return "challenging"
            ratio = monthly_savings / available if available > 0 else 1.0
            if ratio > 0.5:
                return "challenging"
            if ratio > 0.3:
                return "moderate"
            return "achievable"
        if monthly_savings > 50_000:
            return "challenging"
        if monthly_savings > 20_000:
            return "moderate"
        return "achievable"

    # ---------- Rule-based fallback ----------
    @staticmethod
    def generate_rule_based_advice(req: AIAdviceRequest) -> str:
        months = AIAdvisorService.calculate_months(req.time_frame.value, req.time_frame.unit)
        monthly = AIAdvisorService.calculate_monthly_savings(req.target_amount, req.current_savings, months)

        summaries = {
            GoalType.HOUSE: f"Accumulate ₹{req.target_amount:,.0f} for a home in {req.time_frame.value} {req.time_frame.unit}.",
            GoalType.RETIREMENT: f"Build a retirement corpus of ₹{req.target_amount:,.0f} over {req.time_frame.value} {req.time_frame.unit}.",
            GoalType.EDUCATION: f"Save ₹{req.target_amount:,.0f} for education within {req.time_frame.value} {req.time_frame.unit}.",
            GoalType.INVESTMENT: f"Reach an investment target of ₹{req.target_amount:,.0f} in {req.time_frame.value} {req.time_frame.unit}.",
            GoalType.EMERGENCY_FUND: f"Build an emergency fund of ₹{req.target_amount:,.0f} over {req.time_frame.value} {req.time_frame.unit}.",
        }
        summary = summaries.get(req.goal_type, f"Achieve goal of ₹{req.target_amount:,.0f} in {req.time_frame.value} {req.time_frame.unit}.")

        if months <= 24:
            strategies = [
                "Use high-yield savings / fixed deposits to protect capital",
                "Consider liquid/ultra-short funds for slightly higher returns"
            ]
        elif months <= 60:
            strategies = [
                "Use balanced funds (~60–70% equity) for growth with moderation",
                "Start SIPs in diversified equity funds for rupee-cost averaging"
            ]
        else:
            strategies = [
                "Run SIPs in broad-market equity index funds",
                "Keep small debt allocation for stability and rebalancing"
            ]

        tips_map = {
            GoalType.HOUSE: [
                "Compare home loan options and pre-approval requirements",
                "Budget for stamp duty/registration/interiors",
                "Check area infrastructure and growth potential"
            ],
            GoalType.RETIREMENT: [
                "Max EPF/PPF for tax benefits",
                "Raise contributions with salary hikes",
                "Consider NPS for extra tax advantage"
            ],
            GoalType.EMERGENCY_FUND: [
                "Target 6 months of expenses",
                "Keep funds liquid and accessible",
                "Use liquid funds vs. savings account for better yield"
            ]
        }
