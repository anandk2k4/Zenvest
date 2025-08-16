from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class Transaction(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    user_id: str
    category: str
    amount: float
    date: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
