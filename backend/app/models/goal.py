from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

GoalCategory = Literal[
    'house', 'retirement', 'education', 'investment', 
    'emergency', 'vacation', 'car', 'debt'
]

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class Goal(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    clerk_user_id: str
    title: str
    category: GoalCategory

    target_amount: float = Field(..., alias="targetAmount")
    current_amount: float = Field(default=0.0, alias="currentAmount")
    duration: int
    description: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

    class Config:
        allow_population_by_field_name = True   # let us return snake_case as camelCase
        populate_by_name = True                 # let us accept camelCase from frontend
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}