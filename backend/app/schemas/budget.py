from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

from ..models.budget import (
    UserResponse,
    BudgetResponse,
    ExpenseResponse,
    IncomeResponse,
    BudgetAnalytics,
    MonthlyReport,
    CategorySummary,
    DashboardSummary,
    AIAdvice,
    AIAdvisorResponse,
)

# ------------------- GENERIC PAGINATION -------------------
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int
    success: bool = True

# ------------------- LIST RESPONSES -------------------
class BudgetListResponse(BaseModel):
    budgets: List[BudgetResponse]
    total_count: int
    success: bool = True

class ExpenseListResponse(BaseModel):
    expenses: List[ExpenseResponse]
    total_count: int
    total_amount: float
    success: bool = True

class IncomeListResponse(BaseModel):
    income: List[IncomeResponse]
    total_count: int
    total_amount: float
    success: bool = True

# ------------------- DASHBOARD & AI RESPONSES -------------------
# Reuse DashboardSummary, AIAdvice, AIAdvisorResponse from models.budget
# so no duplication here.

class DashboardSummaryResponse(BaseModel):
    summary: DashboardSummary
    success: bool = True

class AIAdvisorResponseWrapper(BaseModel):
    ai: AIAdvisorResponse
    success: bool = True
