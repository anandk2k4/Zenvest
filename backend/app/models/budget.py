from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

# ------------------- ENUMS -------------------
class ExpenseCategory(str, Enum):
    FOOD = "Food & Dining"
    TRANSPORTATION = "Transportation"
    SHOPPING = "Shopping"
    ENTERTAINMENT = "Entertainment"
    BILLS = "Bills & Utilities"
    HEALTHCARE = "Healthcare"
    EDUCATION = "Education"
    TRAVEL = "Travel"
    GROCERIES = "Groceries"
    OTHER = "Other"

class IncomeType(str, Enum):
    SALARY = "Salary"
    FREELANCE = "Freelance"
    BUSINESS = "Business"
    INVESTMENT = "Investment"
    RENTAL = "Rental"
    OTHER = "Other"

class BudgetPeriod(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

# ------------------- USER (FROM CLERK) -------------------
class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")  # Clerk user_id ("sub")
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True

# ------------------- BUDGET MODELS -------------------
class BudgetCreate(BaseModel):
    name: str
    total_income: float
    period: BudgetPeriod = BudgetPeriod.MONTHLY
    category_limits: Dict[ExpenseCategory, float] = {}
    savings_goal: Optional[float] = None
    description: Optional[str] = None

class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    total_income: Optional[float] = None
    period: Optional[BudgetPeriod] = None
    category_limits: Optional[Dict[ExpenseCategory, float]] = None
    savings_goal: Optional[float] = None
    description: Optional[str] = None

class BudgetResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    name: str
    total_income: float
    period: BudgetPeriod
    category_limits: Dict[str, float]
    savings_goal: Optional[float] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

# ------------------- EXPENSE MODELS -------------------
class ExpenseCreate(BaseModel):
    amount: float
    category: ExpenseCategory
    description: str
    date: datetime = Field(default_factory=datetime.utcnow)
    budget_id: Optional[str] = None

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = Field(None, min_length=1, max_length=200)
    date: Optional[datetime] = None
    
class ExpenseResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    budget_id: Optional[str] = None
    amount: float
    category: str
    description: str
    date: datetime
    created_at: datetime

    class Config:
        populate_by_name = True

# ------------------- INCOME MODELS -------------------
class IncomeCreate(BaseModel):
    amount: float
    source: str
    type: IncomeType
    description: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)
    budget_id: Optional[str] = None
    
class IncomeUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    source: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[IncomeType] = None
    description: Optional[str] = Field(None, max_length=200)
    date: Optional[datetime] = None

class IncomeResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    budget_id: Optional[str] = None
    amount: float
    source: str
    type: str
    description: Optional[str] = None
    date: datetime
    created_at: datetime

    class Config:
        populate_by_name = True

# ------------------- DASHBOARD & AI -------------------
class CategorySummary(BaseModel):
    category: str
    total_amount: float
    transaction_count: int
    percentage_of_total: float
    
class BudgetAnalytics(BaseModel):
    budget_id: str
    total_income: float
    total_expenses: float
    total_savings: float
    savings_rate: float
    category_breakdown: List[CategorySummary]
    remaining_budget: float
    days_remaining: int


class MonthlyReport(BaseModel):
    month: str
    year: int
    total_income: float
    total_expenses: float
    net_savings: float
    top_expense_category: str
    expense_trend: str

class DashboardSummary(BaseModel):
    user: UserResponse
    current_month_income: float
    current_month_expenses: float
    current_month_savings: float
    active_budgets: int
    recent_expenses: List[ExpenseResponse]
    category_breakdown: List[CategorySummary]
    monthly_trend: List[MonthlyReport]

class AIAdvice(BaseModel):
    advice_type: str
    title: str
    message: str
    priority: str
    action_items: List[str]
    potential_savings: Optional[float] = None

class AIAdvisorResponse(BaseModel):
    user_id: str
    advice_list: List[AIAdvice]
    generated_at: datetime
    budget_health_score: float

# ------------------- GENERIC RESPONSES -------------------
class MessageResponse(BaseModel):
    message: str
    success: bool = True
