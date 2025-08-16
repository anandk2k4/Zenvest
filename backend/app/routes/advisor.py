from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import google.generativeai as genai

router = APIRouter()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class TimeFrame(BaseModel):
    value: int
    unit: str  # "months" or "years"

class AIAdviceRequest(BaseModel):
    user_id: str
    goal_type: str
    target_amount: float
    current_savings: float
    time_frame: TimeFrame
    description: str | None = None
    risk_tolerance: str | None = None
    monthly_income: float | None = None
    monthly_expenses: float | None = None

class AIAdviceResponse(BaseModel):
    needs_clarification: bool
    clarification_questions: list[str]
    advice: str | None = None
    monthly_savings_required: float | None = None
    goal_feasibility: str | None = None


@router.post("/ai-advisor", response_model=AIAdviceResponse)
async def ai_advisor(data: AIAdviceRequest):
    try:
        # Convert time frame to months
        months_total = data.time_frame.value if data.time_frame.unit == "months" else data.time_frame.value * 12
        monthly_required = (
            (data.target_amount - data.current_savings) / months_total
            if data.target_amount > data.current_savings else 0
        )

        # Build dynamic prompt for Gemini
        prompt = f"""
You are an AI financial advisor. 
The user has given the following goal details:

Goal Type: {data.goal_type}
Target Amount: ₹{data.target_amount}
Current Savings: ₹{data.current_savings}
Time Frame: {data.time_frame.value} {data.time_frame.unit}
Risk Tolerance: {data.risk_tolerance}
Monthly Income: {data.monthly_income}
Monthly Expenses: {data.monthly_expenses}
Monthly Savings Required: ₹{round(monthly_required)}
Description: {data.description}

Tasks for you:
1. If any critical information is missing to give accurate investment advice, list clarification questions in plain text.
2. Otherwise, give a **detailed and structured investment plan** including:
   - Goal feasibility (Achievable, Moderate, or Challenging)
   - Recommended monthly saving amount
   - Recommended investment instruments (e.g., mutual funds, bonds, fixed deposits)
   - Step-by-step approach to reach the target
   - Risk-adjusted tips
   - Warnings or adjustments if the goal is unrealistic

3. Respond in JSON strictly with the following keys:
   - needs_clarification (boolean)
   - clarification_questions (array of strings)
   - advice (string or null)
   - monthly_savings_required (number or null)
   - goal_feasibility ("achievable" | "moderate" | "challenging" or null)
"""

        # Send prompt to Gemini
        model = genai.GenerativeModel("gemini-pro")
        gemini_response = model.generate_content(prompt)

        # Parse Gemini's JSON output
        import json
        try:
            ai_json = json.loads(gemini_response.text)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="AI returned invalid JSON format.")

        # Validate keys exist
        return AIAdviceResponse(
            needs_clarification=ai_json.get("needs_clarification", False),
            clarification_questions=ai_json.get("clarification_questions", []),
            advice=ai_json.get("advice"),
            monthly_savings_required=ai_json.get("monthly_savings_required"),
            goal_feasibility=ai_json.get("goal_feasibility")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
