from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from jose import jwt
import requests, time, logging

from app.db import get_database
from ..schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from ..services.goal_service import GoalService
from ..core.config import settings

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

def _get_unverified_header(token: str):
    return jwt.get_unverified_header(token)

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

        # python-jose handles JWK dict directly ✅
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

@router.post("/goal", response_model=GoalResponse)
async def create_goal(
    goal_data: GoalCreate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    goal_service = GoalService(db)
    return await goal_service.create_goal(clerk_user_id, goal_data)

@router.get("/goal", response_model=List[GoalResponse])
async def get_user_goals(
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    goal_service = GoalService(db)
    return await goal_service.get_user_goals(clerk_user_id)

@router.get("/goal/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: str,
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    goal_service = GoalService(db)
    goal = await goal_service.get_goal_by_id(goal_id, clerk_user_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return goal

@router.put("/goal/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    update_data: GoalUpdate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    goal_service = GoalService(db)
    goal = await goal_service.update_goal(goal_id, clerk_user_id, update_data)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return goal

@router.delete("/goal/{goal_id}")
async def delete_goal(
    goal_id: str,
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    goal_service = GoalService(db)
    success = await goal_service.delete_goal(goal_id, clerk_user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return {"message": "Goal deleted successfully"}
