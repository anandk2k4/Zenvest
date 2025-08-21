from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MonthlyReport(BaseModel):
    id: Optional[str] = Field(alias="_id")
    month: int
    year: int
    total_income: float
    total_expenses: float
    net_savings: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
