from fastapi import APIRouter, HTTPException, Depends, status, Header
from typing import List, Optional
from datetime import datetime
from jose import jwt
import requests, time, logging
from app.db import get_database
from app.services.budget_service import BudgetService
from app.models.budget import BudgetCreate, BudgetUpdate, BudgetResponse, MessageResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..core.config import settings  # adjust if your settings import path is different

router = APIRouter()

logger = logging.getLogger(__name__)

# --- Clerk JWKS Cache ---
_jwks_cache = {"keys": None, "ts": 0}

def _get_jwks():
    now = time.time()
    if _jwks_cache["keys"] and now - _jwks_cache["ts"] < 900:  # 15 min cache
        return _jwks_cache["keys"]

    if not settings.CLERK_JWKS_URL:
        raise RuntimeError("CLERK_JWKS_URL is not set.")

    resp = requests.get(settings.CLERK_JWKS_URL, timeout=5)
    resp.raise_for_status()
    data = resp.json()
    _jwks_cache["keys"] = data
    _jwks_cache["ts"] = now
    return data

def _find_key(kid: str, jwks: dict):
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            return k
    return None

def _clerk_verify_and_get_user(token: str) -> Optional[str]:
    try:
        header = jwt.get_unverified_header(token)
        jwks = _get_jwks()
        key = _find_key(header.get("kid"), jwks)
        if key is None:
            logger.error("[Clerk] No matching JWK for kid.")
            return None

        payload = jwt.decode(
            token,
            key,
            algorithms=[header.get("alg", "RS256")],
            issuer=settings.CLERK_ISSUER,
            options={"verify_aud": False},
        )
        return payload.get("sub")
    except Exception as e:
        logger.error("[Clerk] Token verification failed: %s", e)
        return None

async def get_current_user_id(authorization: Optional[str] = Header(default=None, alias="Authorization")) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Missing Bearer token")

    token = authorization.replace("Bearer ", "").strip()
    user_id = _clerk_verify_and_get_user(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")

    return user_id


# ---------------------- Routes ----------------------


@router.post("/budget", response_model=BudgetResponse)
async def create_budget(budget: BudgetCreate, user_id=Depends(get_current_user_id),db: AsyncIOMotorDatabase = Depends(get_database)):
    budget_service = BudgetService(db)
    return await budget_service.create_budget(budget, user_id)

@router.get("/budget", response_model=List[BudgetResponse])
async def get_budgets(user_id=Depends(get_current_user_id),db: AsyncIOMotorDatabase = Depends(get_database)):
    budget_service = BudgetService(db)
    return await budget_service.get_user_budgets(user_id)

@router.get("/budget/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: str, user_id=Depends(get_current_user_id),db: AsyncIOMotorDatabase = Depends(get_database)):
    budget_service = BudgetService(db)
    budget = await budget_service.get_budget(budget_id, user_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget

@router.put("/budget/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: str, budget: BudgetUpdate, user_id=Depends(get_current_user_id),db: AsyncIOMotorDatabase = Depends(get_database)):
    budget_service = BudgetService(db)
    updated = await budget_service.update_budget(budget_id, budget, user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Budget not found")
    return updated

@router.delete("/budget/{budget_id}", response_model=MessageResponse)
async def delete_budget(budget_id: str, user_id=Depends(get_current_user_id),db: AsyncIOMotorDatabase = Depends(get_database)):
    budget_service = BudgetService(db)
    return await budget_service.delete_budget(budget_id, user_id)