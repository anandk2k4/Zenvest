from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, FastAPI
from motor.motor_asyncio import AsyncIOMotorDatabase
from jose import jwt
import httpx, asyncio, time, logging
from cachetools import TTLCache
from app.routes.clerk import get_current_user_id
from app.db import get_database
from ..schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from ..services.goal_service import GoalService
from ..core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)



async def get_goal_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> GoalService:
    return GoalService(db)

# ---------------------- Routes ----------------------
@router.post("/goal", response_model=GoalResponse)
async def create_goal(
    goal_data: GoalCreate,
    clerk_user_id: str = Depends(get_current_user_id),
    goal_service: GoalService = Depends(get_goal_service),
):
    return await goal_service.create_goal(clerk_user_id, goal_data)

@router.get("/goal", response_model=List[GoalResponse])
async def get_user_goals(
    clerk_user_id: str = Depends(get_current_user_id),
    goal_service: GoalService = Depends(get_goal_service),
):
    return await goal_service.get_user_goals(clerk_user_id)

@router.get("/goal/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: str,
    clerk_user_id: str = Depends(get_current_user_id),
    goal_service: GoalService = Depends(get_goal_service),
):
    goal = await goal_service.get_goal_by_id(goal_id, clerk_user_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.put("/goal/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    update_data: GoalUpdate,
    clerk_user_id: str = Depends(get_current_user_id),
    goal_service: GoalService = Depends(get_goal_service),
):
    goal = await goal_service.update_goal(goal_id, clerk_user_id, update_data)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.delete("/goal/{goal_id}")
async def delete_goal(
    goal_id: str,
    clerk_user_id: str = Depends(get_current_user_id),
    goal_service: GoalService = Depends(get_goal_service),
):
    success = await goal_service.delete_goal(goal_id, clerk_user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}

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
