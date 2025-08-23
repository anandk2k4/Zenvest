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
from app.routes.clerk import get_current_user_id

router = APIRouter()

logger = logging.getLogger(__name__)



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