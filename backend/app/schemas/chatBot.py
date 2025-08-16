# app/schemas/chatBot.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


# ----------------------------
# Request schema (from frontend)
# ----------------------------
class ChatRequest(BaseModel):
    userId: str
    message: str


# ----------------------------
# Message schema (for chat history)
# ----------------------------
class Message(BaseModel):
    role: str   # "user" or "bot"
    text: Optional[str] = None
    response: Optional[Dict[str, Any]] = None


# ----------------------------
# Response schema (AI reply)
# ----------------------------
class ChatResponse(BaseModel):
    type: str
    title: str
    description: str
    sections: Optional[List[Dict[str, Any]]] = None
    advice: Optional[Dict[str, Any]] = None
    disclaimer: Optional[str] = None


# ----------------------------
# Chat history response schema
# ----------------------------
class ChatHistoryResponse(BaseModel):
    userId: str
    messages: List[Message]
    created_at: datetime
    updated_at: datetime
