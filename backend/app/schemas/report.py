from typing import List
from pydantic import BaseModel
from datetime import datetime
from ..models.report import BudgetAnalytics, MonthlyReport, CategorySummary, BudgetHealthReport

# -------------------------------
# Paginated reports list
# -------------------------------
class ReportListResponse(BaseModel):
    reports: List[MonthlyReport]
    total_count: int

# -------------------------------
# Analytics response schema
# -------------------------------
class AnalyticsResponse(BaseModel):
    budget_id: str
    analytics: BudgetAnalytics
    generated_at: datetime

# -------------------------------
# Health report response
# -------------------------------
class BudgetHealthResponse(BaseModel):
    budget_id: str
    report: BudgetHealthReport
