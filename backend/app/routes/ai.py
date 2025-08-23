from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status, FastAPI
from motor.motor_asyncio import AsyncIOMotorDatabase
from jose import jwt
import httpx, asyncio, time, logging
from cachetools import TTLCache
from app.routes.clerk import get_current_user_id
from app.db import get_database, get_collection
from ..schemas.ai_goal import AIQuery, AIInsightResponse, SavingsPlanRequest, SavingsPlanResponse
from ..services.ai_service import AIService
from ..core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------- AI Insight Helpers -------------------
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

# ---------------------- Routes ----------------------
@router.get("/suggestions", response_model=List[AIInsightResponse])
async def get_ai_suggestions(
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
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
    ai_service = AIService(db)
    try:
        plan = await ai_service.calculate_savings_plan(clerk_user_id, request.goal_id)
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
    ai_service = AIService(db)
    insight = await ai_service.handle_ai_query(clerk_user_id, query.query, query.context)
    await save_ai_insight(clerk_user_id, insight)
    return insight

@router.get("/insights", response_model=List[AIInsightResponse])
async def get_user_insights(
    limit: int = 10,
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    coll = get_collection("ai_insights")
    doc = await coll.find_one({"userId": clerk_user_id}, projection={"_id": 0})

    if not doc or "insights" not in doc:
        return []

    return doc["insights"][-limit:]

# ---------------------- App Startup Hook ----------------------
def init_background_tasks(app: FastAPI):
    @app.on_event("startup")
    async def _startup():
        await _get_http()  # warm HTTP client
        asyncio.create_task(_refresh_jwks_periodically())

    @app.on_event("shutdown")
    async def _shutdown():
        global _http
        if _http:
            await _http.aclose()
            _http = None
