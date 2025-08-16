import { useState, useEffect } from 'react';
import type { Budget, BudgetsSummary, BudgetCreate, BudgetUpdate } from '../types/budget';
import type { Transaction, TransactionCreate } from '../types/transaction';
import { budgetAPI, transactionAPI } from '../services/api';

export const useBudgets = (userId: string) => {
  const [budgetsSummary, setBudgetsSummary] = useState<BudgetsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const summary = await budgetAPI.getAll(userId);
      setBudgetsSummary(summary);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const txns = await transactionAPI.getAll(userId);
      setTransactions(txns);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch transactions');
    }
  };

  const createBudget = async (budget: BudgetCreate): Promise<Budget> => {
    const newBudget = await budgetAPI.create(budget);
    await fetchBudgets(); // Refresh data
    return newBudget;
  };

  const updateBudget = async (id: string, budget: BudgetUpdate): Promise<Budget> => {
    const updatedBudget = await budgetAPI.update(id, budget);
    await fetchBudgets(); // Refresh data
    return updatedBudget;
  };

  const deleteBudget = async (id: string): Promise<void> => {
    await budgetAPI.delete(id);
    await fetchBudgets(); // Refresh data
  };

  const createTransaction = async (transaction: TransactionCreate): Promise<Transaction> => {
    const newTransaction = await transactionAPI.create(transaction);
    await fetchBudgets(); // Refresh budgets to update spent amounts
    await fetchTransactions(); // Refresh transactions
    return newTransaction;
  };

  useEffect(() => {
    if (userId) {
      fetchBudgets();
      fetchTransactions();
    }
  }, [userId]);

  return {
    budgetsSummary,
    transactions,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    createTransaction,
    refetch: () => {
      fetchBudgets();
      fetchTransactions();
    }
  };
};