import cohere
import json
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.budget import (
    DashboardSummary,
    CategorySummary,
    MonthlyReport,
    AIAdvisorResponse,
    AIAdvice,
)
from ..core.config import settings


class DashboardService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.cohere_client = cohere.Client(settings.COHERE_API_KEY)

    # -------------------------------
    # Helpers
    # -------------------------------
    async def _insert_dashboard_summary(self, data: dict):
        await self.db.dashboard_summaries.insert_one(data)

    async def _insert_ai_advice(self, data: dict):
        await self.db.ai_advice.insert_one(data)

    async def get_total_income(self, user_id: str) -> float:
        """Return cached total income if available, else compute & cache it."""
        cached = await self.db.user_financial_stats.find_one({"user_id": user_id})
        if cached and "total_income" in cached:
            return cached["total_income"]

        # Compute if not cached
        income_doc = await self.db.income.aggregate([
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)

        total_income = income_doc[0]["total"] if income_doc else 0.0

        # Store in cache
        await self.db.user_financial_stats.update_one(
            {"user_id": user_id},
            {"$set": {"total_income": total_income, "last_updated": datetime.utcnow()}},
            upsert=True,
        )

        return total_income

    # -------------------------------
    # Dashboard summary
    # -------------------------------
    async def get_summary(self, user_id: str) -> DashboardSummary:
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)

        # Run queries concurrently
        income_task = self.get_total_income(user_id)
        expense_task = self.db.expenses.aggregate([
            {"$match": {"user_id": user_id, "date": {"$gte": month_start}}},
            {"$group": {"_id": "$category", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
        ]).to_list(None)
        budgets_task = self.db.budgets.count_documents({"user_id": user_id})
        recent_expenses_task = self.db.expenses.find(
            {"user_id": user_id}
        ).sort("date", -1).limit(5).to_list(5)

        income, expenses, active_budgets, recent_expenses = await asyncio.gather(
            income_task, expense_task, budgets_task, recent_expenses_task
        )

        total_expenses = sum(e["total"] for e in expenses)

        category_breakdown = [
            CategorySummary(
                category=e["_id"],
                total_amount=e["total"],
                transaction_count=e["count"],
                percentage_of_total=(e["total"] / total_expenses * 100) if total_expenses else 0,
            )
            for e in expenses
        ]

        monthly_trend = [
            MonthlyReport(
                month=now.strftime("%B"),
                year=now.year,
                total_income=income,
                total_expenses=total_expenses,
                net_savings=income - total_expenses,
                top_expense_category=category_breakdown[0].category if category_breakdown else "Other",
                expense_trend="stable",
            )
        ]

        summary = DashboardSummary(
            user_id= user_id,
            current_month_income=income,
            current_month_expenses=total_expenses,
            current_month_savings=income - total_expenses,
            active_budgets=active_budgets,
            recent_expenses=[{**r, "_id": str(r["_id"])} for r in recent_expenses],
            category_breakdown=category_breakdown,
            monthly_trend=monthly_trend,
        )

        # ✅ Fire-and-forget insert
        asyncio.create_task(self._insert_dashboard_summary(summary.dict(by_alias=True)))

        return summary

    # -------------------------------
    # AI advice
    # -------------------------------
    async def get_ai_advice(self, user_id: str) -> AIAdvisorResponse:
        income_task = self.get_total_income(user_id)
        expenses_task = self.db.expenses.aggregate([
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "expenses": {"$sum": "$amount"}}}
        ]).to_list(1)

        income, expenses_doc = await asyncio.gather(income_task, expenses_task)

        total_income = income
        total_expenses = expenses_doc[0]["expenses"] if expenses_doc else 0

        savings = total_income - total_expenses
        savings_rate = (savings / total_income * 100) if total_income > 0 else 0

        highest_category_msg = ""
        if savings < 0:
            top_category_doc = await self.db.expenses.aggregate([
                {"$match": {"user_id": user_id}},
                {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
                {"$sort": {"total": -1}},
                {"$limit": 1}
            ]).to_list(1)

            if top_category_doc:
                top_category = top_category_doc[0]["_id"]
                top_amount = top_category_doc[0]["total"]
                required_reduction = abs(savings) / top_amount * 100 if top_amount > 0 else 0
                highest_category_msg = (
                    f'The user is overspending. The highest expense category is "{top_category}" '
                    f'with {top_amount:.2f}. Suggest reducing this by at least {required_reduction:.1f}%.'
                )

        # --- Cohere prompt ---
        prompt = f"""
        The user has a total income of {total_income:.2f} and total expenses of {total_expenses:.2f}.
        Their savings are {savings:.2f}, which is {savings_rate:.1f}% of income.
        {highest_category_msg}
        Please provide 2-3 actionable financial advice items in JSON format:
        [
            {{
                "advice_type": "savings|expense_reduction|budget_optimization",
                "title": "string",
                "message": "string",
                "priority": "high|medium|low",
                "action_items": ["string", "string"],
                "potential_savings": number
            }}
        ]
        """

        response = self.cohere_client.generate(
            model="command-r-plus",
            prompt=prompt,
            max_tokens=300,
            temperature=0.7,
        )
        text_output = response.generations[0].text.strip()

        try:
            advice_data = json.loads(text_output)
        except Exception:
            advice_data = [{
                "advice_type": "budget_optimization",
                "title": "Keep Tracking",
                "message": text_output,
                "priority": "medium",
                "action_items": ["Track expenses", "Review monthly budgets"],
                "potential_savings": None,
            }]

        advice_list = [AIAdvice(**a) for a in advice_data]

        budget_health_score = max(
            0, 100 - (total_expenses / total_income * 100 if total_income else 100)
        )

        ai_result = AIAdvisorResponse(
            user_id=user_id,
            advice_list=advice_list,
            generated_at=datetime.utcnow(),
            budget_health_score=budget_health_score,
        )

        # ✅ Fire-and-forget insert
        asyncio.create_task(self._insert_ai_advice(ai_result.dict(by_alias=True)))

        return ai_result
