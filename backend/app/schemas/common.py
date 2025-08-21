# 📂 app/schemas/common.py
from pydantic import BaseModel
from typing import Optional

class MessageResponse(BaseModel):
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    success: bool = False
