from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional

class GoalType(str, Enum):
    HOUSE = "house"
    RETIREMENT = "retirement"
    EDUCATION = "education"
    INVESTMENT = "investment"
    EMERGENCY_FUND = "emergency_fund"
    VACATION = "vacation"
    CAR = "car"
    DEBT_PAYOFF = "debt_payoff"
    OTHER = "other"

class TimeFrame(BaseModel):
    value: int = Field(..., ge=1)
    unit: str = Field(..., pattern="^(months|years)$")

class GoalBase(BaseModel):
    user_id: str
    goal_type: GoalType
    target_amount: float = Field(..., gt=0)
    current_savings: float = Field(0, ge=0)
    time_frame: TimeFrame
    monthly_income: Optional[float] = Field(None, ge=0)
    monthly_expenses: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    goal_type: Optional[GoalType] = None
    target_amount: Optional[float] = Field(None, gt=0)
    current_savings: Optional[float] = Field(None, ge=0)
    time_frame: Optional[TimeFrame] = None
    monthly_income: Optional[float] = Field(None, ge=0)
    monthly_expenses: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None

class Goal(GoalBase):
    id: str

class AIAdviceRequest(GoalBase):
    pass

class AIAdviceResponse(BaseModel):
    needs_clarification: bool = False
    clarification_questions: list[str] = []
    advice: Optional[str] = None
    monthly_savings_required: Optional[float] = None
    goal_feasibility: Optional[str] = None
