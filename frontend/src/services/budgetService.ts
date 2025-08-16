// frontend/src/services/budgetService.ts
import { api } from "./api";

export const setIncome = (payload: { total_income: number }) => api.post("/budget/income", payload).then(r => r.data);
export const getIncome = () => api.get("/budget/income").then(r => r.data);

export const addExpense = (payload: { category: string; amount: number; note?: string }) => api.post("/budget/expenses", payload).then(r => r.data);
export const getExpenses = (limit = 200, month?: string) => api.get(`/budget/expenses?limit=${limit}` + (month ? `&month=${month}` : "")).then(r => r.data);
export const editExpense = (id: string, payload: { category: string; amount: number; note?: string }) => api.patch(`/budget/expenses/${id}`, payload).then(r => r.data);
export const deleteExpense = (id: string) => api.delete(`/budget/expenses/${id}`).then(r => r.data);

export const getSummary = () => api.get("/dashboard/summary").then(r => r.data);
export const getCategories = () => api.get("/dashboard/categories").then(r => r.data);
export const getTrends = (months = 6) => api.get(`/dashboard/trends?months=${months}`).then(r => r.data);

export const getAdvice = (payload: any) => api.post("/advisor/budget", payload).then(r => r.data);
