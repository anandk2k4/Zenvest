from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
import requests, time, logging
from jose import jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models.budget import IncomeCreate, IncomeUpdate, IncomeResponse, MessageResponse
from ..services.income_service import IncomeService
from ..core.config import settings
from app.db import get_database

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Clerk JWKS Cache ---
_jwks_cache = {"keys": None, "ts": 0}


def _get_jwks():
    now = time.time()
    if _jwks_cache["keys"] and now - _jwks_cache["ts"] < 900:
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


async def get_current_user_id(
    authorization: Optional[str] = Header(default=None, alias="Authorization")
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Missing Bearer token")

    token = authorization.replace("Bearer ", "").strip()
    user_id = _clerk_verify_and_get_user(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")

    return user_id


# ---------------------- Routes ----------------------

@router.post("/budget", response_model=IncomeResponse)
async def add_income(
    income: IncomeCreate,
    user_id=Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)  # ✅ inject service
):
    service=IncomeService(db)
    return await service.add_income(income, user_id)


@router.get("/budget", response_model=List[IncomeResponse])
async def get_income(
    user_id=Depends(get_current_user_id),
    budget_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    service= IncomeService(db)
    return await service.get_income(user_id, budget_id)


@router.put("/budget/{income_id}", response_model=IncomeResponse)
async def update_income(
    income_id: str,
    income: IncomeUpdate,
    user_id=Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    service= IncomeService(db)
    updated = await service.update_income(income_id, income, user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Income not found")
    return updated


@router.delete("/budget/{income_id}", response_model=MessageResponse)
async def delete_income(
    income_id: str,
    user_id=Depends(get_current_user_id),
    service: IncomeService = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    service= IncomeService(db)
    return await service.delete_income(income_id, user_id)
