from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TransactionCreate(BaseModel):
    user_id: str
    category: str
    amount: float
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    category: str
    amount: float
    date: datetime
    description: Optional[str] = None

    @classmethod
    def from_transaction(cls, transaction_doc: dict):
        return cls(
            id=str(transaction_doc["_id"]),
            user_id=transaction_doc["user_id"],
            category=transaction_doc["category"],
            amount=transaction_doc["amount"],
            date=transaction_doc["date"],
            description=transaction_doc.get("description")
        )