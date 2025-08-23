from fastapi import APIRouter, HTTPException, Depends, status, Query, Header
from typing import List, Optional
import requests, time, logging
from jose import jwt
from ..services.expense_service import ExpenseService
from ..models.budget import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseCategory, MessageResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..core.config import settings  # adjust if needed
from app.db import get_database
from app.routes.clerk import get_current_user_id


router = APIRouter()

logger = logging.getLogger(__name__)



@router.post("/budget", response_model=ExpenseResponse)
async def add_expense(expense: ExpenseCreate, user_id=Depends(get_current_user_id),db: AsyncIOMotorDatabase = Depends(get_database)):
    expense_service = ExpenseService(db)
    return await expense_service.add_expense(expense, user_id)

@router.get("/budget", response_model=List[ExpenseResponse])
async def get_expenses(user_id=Depends(get_current_user_id), budget_id: str = None,db: AsyncIOMotorDatabase = Depends(get_database)):
    expense_service = ExpenseService(db)
    return await expense_service.get_expenses(user_id, budget_id)

@router.put("/budget/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: str, expense: ExpenseUpdate, user_id=Depends(get_current_user_id),db: AsyncIOMotorDatabase = Depends(get_database)):
    expense_service = ExpenseService(db)
    updated = await expense_service.update_expense(expense_id, expense, user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated

@router.delete("/budget/{expense_id}", response_model=MessageResponse)
async def delete_expense(expense_id: str, user_id=Depends(get_current_user_id),db: AsyncIOMotorDatabase = Depends(get_database)):
    expense_service = ExpenseService(db)
    return await expense_service.delete_expense(expense_id, user_id)