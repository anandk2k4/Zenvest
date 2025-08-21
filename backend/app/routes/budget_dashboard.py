from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from datetime import datetime
import requests, time, logging
from app.db import get_database
from jose import jwt
from ..services.dashboard_service import DashboardService
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models.budget import ExpenseResponse, IncomeResponse, CategorySummary
from ..schemas.budget import DashboardSummary, AIAdvice, AIAdvisorResponse

from ..core.config import settings  # <-- adjust import path if needed

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


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(user_id=Depends(get_current_user_id),db: AsyncIOMotorDatabase = Depends(get_database),):
    service = DashboardService(db)
    return await service.get_summary(user_id)

@router.get("/ai-advisor", response_model=AIAdvisorResponse)
async def get_dashboard_ai_advice(user_id=Depends(get_current_user_id),db: AsyncIOMotorDatabase = Depends(get_database),):
    service = DashboardService(db)
    return await service.get_ai_advice(user_id)