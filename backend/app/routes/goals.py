from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional
from app.schemas.goal import (
    GoalCreate, GoalUpdate,
    GoalResponse, GoalsListResponse, GoalCreateResponse,
    GoalUpdateResponse, GoalDeleteResponse
)
from ..services.goal_service import GoalService, AIAdvisorService
from ..models.goal import AIAdviceRequest

router = APIRouter()

def get_goal_service(request: Request):
    return GoalService(request.app.mongodb)

def get_ai_service():
    return AIAdvisorService()

@router.post("", response_model=GoalCreateResponse)
async def create_goal(goal: GoalCreate, request: Request, service: GoalService = Depends(get_goal_service)):
    try:
        goal_id = await service.create_goal(goal)
        # Immediately generate AI advice using the same payload
        ai_service = AIAdvisorService()
        advice_resp = await ai_service.get_advice(AIAdviceRequest(**goal.model_dump()))
        return GoalCreateResponse(goal_id=goal_id, message="Financial goal created successfully", ai_advice=advice_resp.advice)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating goal: {str(e)}")

@router.get("/{user_id}", response_model=GoalsListResponse)
async def get_user_goals(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    goal_type: Optional[str] = Query(None),
    service: GoalService = Depends(get_goal_service)
):
    try:
        goals, total = await service.get_goals_by_user(user_id, skip, limit, goal_type)
        return GoalsListResponse(goals=goals, total_count=total, message=f"Retrieved {len(goals)} goals for user {user_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching goals: {str(e)}")

@router.get("/{user_id}/{goal_id}", response_model=GoalResponse)
async def get_goal(user_id: str, goal_id: str, service: GoalService = Depends(get_goal_service)):
    try:
        goal = await service.get_goal_by_id(goal_id, user_id)
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        return GoalResponse(goal=goal, message="Goal retrieved successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving goal: {str(e)}")

@router.put("/{user_id}/{goal_id}", response_model=GoalUpdateResponse)
async def update_goal(user_id: str, goal_id: str, goal_update: GoalUpdate, service: GoalService = Depends(get_goal_service)):
    try:
        ok = await service.update_goal(goal_id, user_id, goal_update)
        if not ok:
            raise HTTPException(status_code=404, detail="Goal not found")
        return GoalUpdateResponse(message="Goal updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating goal: {str(e)}")

@router.delete("/{user_id}/{goal_id}", response_model=GoalDeleteResponse)
async def delete_goal(user_id: str, goal_id: str, service: GoalService = Depends(get_goal_service)):
    try:
        ok = await service.delete_goal(goal_id, user_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Goal not found")
        return GoalDeleteResponse(message="Goal deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting goal: {str(e)}")

@router.post("/advice")
async def get_financial_advice(request: AIAdviceRequest, ai_service: AIAdvisorService = Depends(get_ai_service)):
    try:
        return await ai_service.get_advice(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating advice: {str(e)}")
