from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from ..schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetsSummary
from ..services.budget_service import BudgetService
from bson import ObjectId

router = APIRouter()

def get_budget_service():
    return BudgetService()

@router.post("/budgets", response_model=BudgetResponse)
async def create_budget(
    budget: BudgetCreate,
    service: BudgetService = Depends(get_budget_service)
):
    try:
        created_budget = await service.create_budget(budget)
        return created_budget
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/budgets", response_model=BudgetsSummary)
async def get_budgets(
    user_id: str = Query(...),
    service: BudgetService = Depends(get_budget_service)
):
    try:
        budgets_summary = await service.get_user_budgets(user_id)
        return budgets_summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/budgets/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    budget_update: BudgetUpdate,
    service: BudgetService = Depends(get_budget_service)
):
    try:
        if not ObjectId.is_valid(budget_id):
            raise HTTPException(status_code=400, detail="Invalid budget ID")
        
        updated_budget = await service.update_budget(budget_id, budget_update)
        if not updated_budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        return updated_budget
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/budgets/{budget_id}")
async def delete_budget(
    budget_id: str,
    service: BudgetService = Depends(get_budget_service)
):
    try:
        if not ObjectId.is_valid(budget_id):
            raise HTTPException(status_code=400, detail="Invalid budget ID")
        
        deleted = await service.delete_budget(budget_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        return {"message": "Budget deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
