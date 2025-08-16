import axios from 'axios';
import type { Budget, BudgetCreate, BudgetUpdate, BudgetsSummary } from '../types/budget';
import type { Transaction, TransactionCreate } from '../types/transaction';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Budget API
export const budgetAPI = {
  create: (budget: BudgetCreate): Promise<Budget> =>
    api.post('/budgets', budget).then(res => res.data),
    
  getAll: (userId: string): Promise<BudgetsSummary> =>
    api.get(`/budgets?user_id=${userId}`).then(res => res.data),
    
  update: (id: string, budget: BudgetUpdate): Promise<Budget> =>
    api.put(`/budgets/${id}`, budget).then(res => res.data),
    
  delete: (id: string): Promise<void> =>
    api.delete(`/budgets/${id}`).then(res => res.data),
};

// Transaction API
export const transactionAPI = {
  create: (transaction: TransactionCreate): Promise<Transaction> =>
    api.post('/transactions', transaction).then(res => res.data),
    
  getAll: (userId: string, category?: string, startDate?: string, endDate?: string): Promise<Transaction[]> => {
    let url = `/transactions?user_id=${userId}`;
    if (category) url += `&category=${category}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return api.get(url).then(res => res.data);
  },
};