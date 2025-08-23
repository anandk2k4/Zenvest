from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId
from app.models.goal import PyObjectId


InsightType = Literal['suggestion', 'calculation', 'progress']

class AIInsight(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    clerk_user_id: str
    type: InsightType
    title: str
    content: str
    actionable: Optional[str] = None
    goal_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
