import cohere
import json
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase


from app.db import get_database
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

    async def get_summary(self, user_id: str) -> DashboardSummary:
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)

        # --- Current month income ---
        income_cursor = self.db.income.aggregate([
            {"$match": {"user_id": user_id, "date": {"$gte": month_start}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ])
        income_doc = await income_cursor.to_list(1)
        current_income = income_doc[0]["total"] if income_doc else 0.0

        # --- Current month expenses ---
        expense_cursor = self.db.expenses.aggregate([
            {"$match": {"user_id": user_id, "date": {"$gte": month_start}}},
            {"$group": {"_id": "$category", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
        ])
        expenses = await expense_cursor.to_list(None)
        total_expenses = sum(e["total"] for e in expenses)

        # --- Category breakdown ---
        category_breakdown = []
        for e in expenses:
            percentage = (e["total"] / total_expenses * 100) if total_expenses > 0 else 0
            category_breakdown.append(CategorySummary(
                category=e["_id"],
                total_amount=e["total"],
                transaction_count=e["count"],
                percentage_of_total=percentage,
            ))

        # --- Active budgets count ---
        active_budgets = await self.db.budgets.count_documents({"user_id": user_id})

        # --- Recent expenses ---
        recent_cursor = self.db.expenses.find({"user_id": user_id}).sort("date", -1).limit(5)
        recent_expenses = []
        async for r in recent_cursor:
            r["_id"] = str(r["_id"])
            recent_expenses.append(r)

        # --- Monthly trend (stub) ---
        monthly_trend = [
            MonthlyReport(
                month=now.strftime("%B"),
                year=now.year,
                total_income=current_income,
                total_expenses=total_expenses,
                net_savings=current_income - total_expenses,
                top_expense_category=category_breakdown[0].category if category_breakdown else "Other",
                expense_trend="stable",
            )
        ]

        summary = DashboardSummary(
            user_id=user_id,  # placeholder user
            current_month_income=current_income,
            current_month_expenses=total_expenses,
            current_month_savings=current_income - total_expenses,
            active_budgets=active_budgets,
            recent_expenses=recent_expenses,
            category_breakdown=category_breakdown,
            monthly_trend=monthly_trend,
        )

        # ✅ Insert into Mongo
        await self.db.dashboard_summaries.insert_one(summary.dict(by_alias=True))

        return summary

    async def get_ai_advice(self, user_id: str) -> AIAdvisorResponse:
        # --- Aggregate totals ---
        total_income_doc = await self.db.income.aggregate([
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "income": {"$sum": "$amount"}}}
        ]).to_list(1)
        total_income = total_income_doc[0]["income"] if total_income_doc else 0

        total_expenses_doc = await self.db.expenses.aggregate([
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "expenses": {"$sum": "$amount"}}}
        ]).to_list(1)
        total_expenses = total_expenses_doc[0]["expenses"] if total_expenses_doc else 0

        savings = total_income - total_expenses
        savings_rate = (savings / total_income * 100) if total_income > 0 else 0

        # --- Check if savings are negative ---
        highest_category_msg = ""
        if savings < 0:
            # get highest expense category
            top_category_doc = await self.db.expenses.aggregate([
                {"$match": {"user_id": user_id}},
                {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
                {"$sort": {"total": -1}},
                {"$limit": 1}
            ]).to_list(1)
    
            if top_category_doc:
                top_category = top_category_doc[0]["_id"]
                top_amount = top_category_doc[0]["total"]
    
                # calculate required reduction %
                required_reduction = abs(savings) / top_amount * 100 if top_amount > 0 else 0

                highest_category_msg = f"""
                Note: The user is overspending. The highest expense category is "{top_category}" with {top_amount:.2f}.
                Suggest reducing this category by at least {required_reduction:.1f}% to bring savings back into positive.
                """

        # --- Build prompt for Cohere ---
        prompt = f"""
        The user has a total income of {total_income:.2f} and total expenses of {total_expenses:.2f}.
        Their savings are {savings:.2f}, which is {savings_rate:.1f}% of income.
        {highest_category_msg}
        Please provide 2-3 pieces of actionable financial advice in JSON format with this structure:
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

        # ✅ Insert into Mongo
        await self.db.ai_advice.insert_one(ai_result.dict(by_alias=True))

        return ai_result    