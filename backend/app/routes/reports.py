from fastapi import APIRouter, HTTPException
from typing import List
from ..services.budget_service import get_reports, get_report

router = APIRouter(prefix="/api/budget/reports", tags=["Reports"])

@router.get("/", response_model=List[dict])
async def list_reports():
    return await get_reports()

@router.get("/{year}/{month}", response_model=dict)
async def get_monthly_report(year: int, month: int):
    report = await get_report(year, month)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
