from pydantic import BaseModel
from typing import Optional, List
from app.models.ai_goal import InsightType

class AIQuery(BaseModel):
    query: str
    context: Optional[str] = None

class AIInsightResponse(BaseModel):
    id: str
    type: InsightType
    title: str
    content: str
    actionable: Optional[str] = None
    goal_id: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True

class SavingsPlanRequest(BaseModel):
    goal_id: str

class SavingsPlanResponse(BaseModel):
    monthly_required: float
    total_remaining: float
    months_remaining: int
    suggested_investment: str
    expected_returns: str
