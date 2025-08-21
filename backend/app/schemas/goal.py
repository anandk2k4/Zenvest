from pydantic import BaseModel
from typing import Optional
from app.models.goal import GoalCategory
from datetime import datetime


class GoalCreate(BaseModel):
    title: str
    category: str
    targetAmount: int
    currentAmount: int
    duration: int
    description: Optional[str] = None
    currentAmount: int = 0   # default

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[GoalCategory] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    duration: Optional[int] = None
    description: Optional[str] = None

class GoalResponse(BaseModel):
    id: str
    title: str
    category: GoalCategory
    target_amount: float
    current_amount: float
    duration: int
    description: Optional[str] = None
    created_at: datetime
    progress_percentage: float
    
    class Config:
        from_attributes = True
