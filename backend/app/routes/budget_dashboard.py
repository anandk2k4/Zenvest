from fastapi import APIRouter, Depends, HTTPException, Header, FastAPI
from typing import Optional
import asyncio, time, logging
import httpx
from jose import jwt
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.routes.clerk import get_current_user_id
from app.db import get_database
from ..services.dashboard_service import DashboardService
from ..schemas.budget import DashboardSummary, AIAdvisorResponse
from ..core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Clerk JWKS Cache ---

# ---------------------- Routes ----------------------

@router.get(
    "/summary",
    response_model=DashboardSummary,
    response_model_exclude_none=True,
)
async def get_dashboard_summary(
    user_id=Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = DashboardService(db)
    return await service.get_summary(user_id)


@router.get(
    "/ai-advisor",
    response_model=AIAdvisorResponse,
    response_model_exclude_none=True,
)
async def get_dashboard_ai_advice(
    user_id=Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = DashboardService(db)
    return await service.get_ai_advice(user_id)


# ---------------------- App Startup Hook ----------------------

def init_background_tasks(app: FastAPI):
    @app.on_event("startup")
    async def start_jwks_task():
        asyncio.create_task(_refresh_jwks_periodically())
