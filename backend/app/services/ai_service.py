import cohere
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.models.ai_goal import AIInsight
from app.schemas.ai_goal import AIInsightResponse, SavingsPlanResponse
from app.services.goal_service import GoalService
import re

class AIService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.collection = database.ai_insights
        self.cohere_client = cohere.Client(settings.COHERE_API_KEY)
        self.goal_service = GoalService(database)

    async def generate_financial_suggestions(self, clerk_user_id: str, user_profile: Dict[str, Any]) -> List[AIInsightResponse]:
        """Generate AI-powered financial suggestions based on user profile and goals"""
        
        # Get user's current goals
        goals = await self.goal_service.get_user_goals(clerk_user_id)
        
        # Prepare context for AI
        context = self._prepare_user_context(user_profile, goals)
        
        # Generate suggestions using Cohere
        prompt = f"""
        Based on the following user financial profile, provide 2-3 specific financial suggestions:
        
        {context}
        
        Please provide actionable financial advice in the following format:
        1. Suggestion Title
        2. Detailed explanation
        3. Specific actionable step
        
        Focus on:
        - Emergency fund optimization
        - Retirement planning
        - Investment diversification
        - Goal prioritization
        """
        
        try:
            response = self.cohere_client.generate(
                model='command-r-plus',
                prompt=prompt,
                max_tokens=500,
                temperature=0.7
            )
            
            suggestions = self._parse_ai_response(response.generations[0].text)
            
            # Store insights in database
            stored_insights = []
            for suggestion in suggestions:
                insight = AIInsight(
                    clerk_user_id=clerk_user_id,
                    type="suggestion",
                    title=suggestion["title"],
                    content=suggestion["content"],
                    actionable=suggestion.get("actionable")
                )
                
                result = await self.collection.insert_one(insight.dict(by_alias=True))
                created_insight = await self.collection.find_one({"_id": result.inserted_id})
                stored_insights.append(self._format_insight_response(created_insight))
            
            return stored_insights
            
        except Exception as e:
            # Fallback to predefined suggestions if AI fails
            return await self._generate_fallback_suggestions(clerk_user_id, user_profile, goals)

    async def calculate_savings_plan(self, clerk_user_id: str, goal_id: str) -> SavingsPlanResponse:
        """Calculate detailed savings plan for a specific goal"""
        
        goal = await self.goal_service.get_goal_by_id(goal_id, clerk_user_id)
        if not goal:
            raise ValueError("Goal not found")
        
        remaining_amount = goal.target_amount - goal.current_amount
        monthly_required = remaining_amount / goal.duration
        
        # Generate AI-powered investment suggestions
        prompt = f"""
        For a financial goal of ₹{goal.target_amount:,.0f} ({goal.category}) with ₹{remaining_amount:,.0f} remaining 
        to be saved over {goal.duration} months (₹{monthly_required:,.0f}/month), suggest:
        
        1. Best investment options
        2. Expected returns
        3. Risk considerations
        
        Keep response concise and practical.
        """
        
        try:
            response = self.cohere_client.generate(
                model='command-r-plus',
                prompt=prompt,
                max_tokens=200,
                temperature=0.5
            )
            
            ai_suggestion = response.generations[0].text.strip()
            
        except Exception:
            ai_suggestion = self._get_default_investment_suggestion(goal.category)
        
        # Store calculation insight
        insight = AIInsight(
            clerk_user_id=clerk_user_id,
            type="calculation",
            title=f"Savings Plan: {goal.title}",
            content=f"Target: ₹{goal.target_amount:,.0f}, Remaining: ₹{remaining_amount:,.0f}",
            actionable=f"Save ₹{monthly_required:,.0f}/month. {ai_suggestion}",
            goal_id=goal_id
        )
        
        await self.collection.insert_one(insight.dict(by_alias=True))
        
        return SavingsPlanResponse(
            monthly_required=monthly_required,
            total_remaining=remaining_amount,
            months_remaining=goal.duration,
            suggested_investment=ai_suggestion,
            expected_returns=self._calculate_expected_returns(monthly_required, goal.duration)
        )

    async def handle_ai_query(self, clerk_user_id: str, query: str, context: str = None) -> AIInsightResponse:
        """Handle general AI queries about finances"""
        
        # Get user context
        user_goals = await self.goal_service.get_user_goals(clerk_user_id)
        
        enhanced_prompt = f"""
        User Query: {query}
        
        Context: User has {len(user_goals)} financial goals.
        {context or ""}
        
        Provide a helpful, specific financial response. If it's a calculation, show the math.
        If it's advice, make it actionable.
        suggest:
        1. Expected returns
        2. Risk considerations
        """
        
        try:
            response = self.cohere_client.generate(
                model='command-r-plus',
                prompt=enhanced_prompt,
                max_tokens=500,
                temperature=0.6
            )
            
            ai_response = response.generations[0].text.strip()
            
        except Exception:
            ai_response = "I can help with financial calculations and advice. Please try rephrasing your question."
        
        # Store the interaction
        insight = AIInsight(
            clerk_user_id=clerk_user_id,
            type="calculation",
            title="AI Response",
            content=ai_response,
            actionable="Would you like me to create a goal based on this calculation?"
        )
        
        result = await self.collection.insert_one(insight.dict(by_alias=True))
        created_insight = await self.collection.find_one({"_id": result.inserted_id})
        
        return self._format_insight_response(created_insight)

    async def get_user_insights(self, clerk_user_id: str, limit: int = 10) -> List[AIInsightResponse]:
        """Get recent AI insights for a user"""
        cursor = self.collection.find({"clerk_user_id": clerk_user_id}).sort("created_at", -1).limit(limit)
        insights = await cursor.to_list(length=None)
        
        return [self._format_insight_response(insight) for insight in insights]

    def _prepare_user_context(self, user_profile: Dict[str, Any], goals: List) -> str:
        """Prepare user context for AI prompts"""
        surplus = user_profile.get("monthly_income", 0) - user_profile.get("monthly_expenses", 0)
        
        context = f"""
        User Profile:
        - Age: {user_profile.get("age", "Unknown")}
        - Monthly Income: ₹{user_profile.get("monthly_income", 0):,.0f}
        - Monthly Expenses: ₹{user_profile.get("monthly_expenses", 0):,.0f}
        - Monthly Surplus: ₹{surplus:,.0f}
        - Dependents: {user_profile.get("dependents", 0)}
        
        Current Goals: {len(goals)}
        """
        
        for goal in goals[:3]:  # Include top 3 goals
            context += f"\n- {goal.title}: ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f} ({goal.progress_percentage:.1f}%)"
        
        return context

    def _parse_ai_response(self, response_text: str) -> List[Dict[str, str]]:
        """Parse AI response into structured suggestions"""
        # Simple parsing - in production, use more sophisticated NLP
        suggestions = []
        lines = response_text.split('\n')
        
        current_suggestion = {}
        for line in lines:
            line = line.strip()
            if line and not line.startswith('-'):
                if 'title' not in current_suggestion:
                    current_suggestion['title'] = line
                elif 'content' not in current_suggestion:
                    current_suggestion['content'] = line
                elif 'actionable' not in current_suggestion:
                    current_suggestion['actionable'] = line
                    suggestions.append(current_suggestion)
                    current_suggestion = {}
        
        return suggestions[:3]  # Limit to 3 suggestions

    async def _generate_fallback_suggestions(self, clerk_user_id: str, user_profile: Dict, goals: List) -> List[AIInsightResponse]:
        """Generate fallback suggestions when AI fails"""
        suggestions = [
            {
                "title": "Emergency Fund Priority",
                "content": "Build an emergency fund covering 6 months of expenses for financial security.",
                "actionable": "Save ₹15,000/month in a high-yield savings account or liquid funds."
            },
            {
                "title": "Start Retirement Planning",
                "content": "Begin retirement planning early to leverage compound growth over time.",
                "actionable": "Invest ₹10,000/month in equity mutual funds through SIP."
            }
        ]
        
        stored_insights = []
        for suggestion in suggestions:
            insight = AIInsight(
                clerk_user_id=clerk_user_id,
                type="suggestion",
                title=suggestion["title"],
                content=suggestion["content"],
                actionable=suggestion["actionable"]
            )
            
            result = await self.collection.insert_one(insight.dict(by_alias=True))
            created_insight = await self.collection.find_one({"_id": result.inserted_id})
            stored_insights.append(self._format_insight_response(created_insight))
        
        return stored_insights

    def _get_default_investment_suggestion(self, category: str) -> str:
        """Get default investment suggestions by goal category"""
        
        if not category:
            return "Consult a financial advisor for personalized advice"

        category = category.strip().lower()  # 
        suggestions = {
            "emergency": "High-yield savings account or liquid funds for easy access",
            "house": "Balanced mutual funds or PPF for stable growth",
            "retirement": "Equity mutual funds for long-term wealth creation",
            "education": "Child education plans or balanced funds",
            "vehicle": "Short-term debt funds or FDs for capital protection",
            "vacation": "Liquid funds or short-term debt funds",
            "investment": "Diversified equity mutual funds",
            "debt": "Focus on high-interest debt first, then invest surplus"
        }
        return suggestions.get(category, "Consult a financial advisor for personalized advice")

    def _calculate_expected_returns(self, monthly_amount: float, duration: int) -> str:
        """Calculate expected returns with different investment options"""
        total_invested = monthly_amount * duration
        
        # Assuming 8% annual return for balanced approach
        annual_rate = 0.08
        monthly_rate = annual_rate / 12
        
        future_value = monthly_amount * (((1 + monthly_rate) ** duration - 1) / monthly_rate)
        returns = future_value - total_invested
        
        return f"With 8% annual returns: ₹{future_value:,.0f} (₹{returns:,.0f} gains)"
    
    def _shorten_text(self, text: str, max_lines: int = 5) -> str:
        """
        Clean and shorten long AI content/actionable into a short readable version.
        """
        if not text:
            return ""

        # Remove extra spaces and newlines
        cleaned = re.sub(r"\s+", " ", text).strip()

        # Split into sentences or bullet points
        parts = re.split(r"(?<=[.!?]) +|- ", cleaned)

        # Keep only first few key points
        short = " • ".join(parts[:max_lines])

        return short    

    def _format_insight_response(self, insight_doc: dict) -> AIInsightResponse:
    
        return AIInsightResponse(
            id=str(insight_doc["_id"]),
            type=insight_doc["type"],
            title=insight_doc["title"],
            content=self._shorten_text(insight_doc.get("content")),
            actionable=self._shorten_text(insight_doc.get("actionable")),
            goal_id=insight_doc.get("goal_id"),
            created_at=insight_doc["created_at"].isoformat()
        )
    
