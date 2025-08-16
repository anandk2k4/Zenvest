# app/models/chat_history.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime


class ChatHistory(BaseModel):
    userId: str
    messages: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
