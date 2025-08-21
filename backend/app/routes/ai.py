from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db import get_database, get_collection
from app.schemas.ai_goal import (
    AIQuery,
    AIInsightResponse,
    SavingsPlanRequest,
    SavingsPlanResponse,
)
import logging
from app.services.ai_service import AIService

from ..core.config import settings
from jose import jwt
import requests, time, logging



logger = logging.getLogger(__name__)
router = APIRouter()

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

# ------------------------------
# Save AI Insights under userId
# ------------------------------

async def save_ai_insight(user_id: str, insight: AIInsightResponse):
    coll = get_collection("ai_insights")
    try:
        result = await coll.update_one(
            {"userId": user_id},
            {"$push": {"insights": insight.dict()}},
            upsert=True,
        )
        if result.upserted_id:
            logger.info(f"[MongoDB] Created new ai_insights doc for userId={user_id}")
        else:
            logger.info(f"[MongoDB] Appended AI insight for userId={user_id}")
    except Exception as e:
        logger.exception(f"[MongoDB] Failed to save ai_insight for userId={user_id}: {e}")


@router.get("/suggestions", response_model=List[AIInsightResponse])
async def get_ai_suggestions(
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Generate AI-powered financial suggestions and save them under this userId.
    """
    ai_service = AIService(db)
    insights = await ai_service.generate_financial_suggestions(clerk_user_id, {})

    # Save each insight into MongoDB
    for ins in insights:
        await save_ai_insight(clerk_user_id, ins)

    return insights


@router.post("/calculate-savings", response_model=SavingsPlanResponse)
async def calculate_savings_plan(
    request: SavingsPlanRequest,
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Calculate a detailed savings plan for a specific goal.
    """
    ai_service = AIService(db)
    try:
        plan = await ai_service.calculate_savings_plan(
            clerk_user_id, request.goal_id
        )
        return plan
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post("/query", response_model=AIInsightResponse)
async def ask_ai(
    query: AIQuery,
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Handle general AI queries about finances, and save the response.
    """
    ai_service = AIService(db)
    insight = await ai_service.handle_ai_query(
        clerk_user_id, query.query, query.context
    )

    await save_ai_insight(clerk_user_id, insight)
    return insight


@router.get("/insights", response_model=List[AIInsightResponse])
async def get_user_insights(
    limit: int = 10,
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get recent AI insights for this user.
    """
    coll = get_collection("ai_insights")
    doc = await coll.find_one({"userId": clerk_user_id}, projection={"_id": 0})

    if not doc or "insights" not in doc:
        return []

    # Return the most recent `limit` insights
    return doc["insights"][-limit:]
