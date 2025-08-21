# backend/app/dependencies.py
from fastapi import Depends, HTTPException
from .db import _db  # ✅ this will now work
from typing import Optional

# Example authentication dependency
def get_current_user(token: Optional[str] = None):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # For now, returning a dummy user
    return {"id": "test_user"}
