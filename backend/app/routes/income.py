from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
import requests, time, logging
from jose import jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models.budget import IncomeCreate, IncomeUpdate, IncomeResponse, MessageResponse
from ..services.income_service import IncomeService
from ..core.config import settings
from app.db import get_database
from app.routes.clerk import get_current_user_id


router = APIRouter()
logger = logging.getLogger(__name__)



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
