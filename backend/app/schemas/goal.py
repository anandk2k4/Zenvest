from pydantic import BaseModel
from typing import List, Optional
from app.models.goal import Goal, GoalType, TimeFrame

class GoalCreate(BaseModel):
    user_id: str
    goal_type: GoalType
    target_amount: float
    current_savings: float = 0
    time_frame: TimeFrame
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    description: Optional[str] = None

class GoalUpdate(BaseModel):
    goal_type: Optional[GoalType] = None
    target_amount: Optional[float] = None
    current_savings: Optional[float] = None
    time_frame: Optional[TimeFrame] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    description: Optional[str] = None

class GoalResponse(BaseModel):
    goal: Goal
    message: str

class GoalCreateResponse(BaseModel):
    goal_id: str
    message: str
    ai_advice: Optional[str] = None

class GoalUpdateResponse(BaseModel):
    message: str

class GoalDeleteResponse(BaseModel):
    message: str

class GoalsListResponse(BaseModel):
    goals: List[Goal]
    total_count: int
    message: str
