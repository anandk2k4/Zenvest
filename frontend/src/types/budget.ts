export interface Budget {
    id: string;
    user_id: string;
    category: string;
    budget_amount: number;
    spent_amount: number;
    remaining: number;
    percentage_spent: number;
    created_at: string;
  }
  
  export interface BudgetCreate {
    user_id: string;
    category: string;
    budget_amount: number;
  }
  
  export interface BudgetUpdate {
    category?: string;
    budget_amount?: number;
  }
  
  export interface BudgetsSummary {
    total_budget: number;
    total_spent: number;
    total_remaining: number;
    budgets: Budget[];
  }