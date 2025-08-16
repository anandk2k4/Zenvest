import React, { useState } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useBudgets } from '@/hooks/useBudgets';
import { Summary } from '@/components/Summary';
import { BudgetCard } from '@/components/BudgetCard';
import { BudgetModal } from '@/components/BudgetModal';
import { TransactionModal } from '@/components/TransactionModal';
import { TransactionList } from '@/components/TransactionList';
import type { Budget as BudgetType } from '@/types/budget';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';


function Budget() {
  const { user, isLoaded } = useUser();
  const {
    budgetsSummary,
    transactions,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    createTransaction
  } = useBudgets(user?.id || '');

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetType | null>(null);

  const handleCreateBudget = async (data: { category: string; budget_amount: number }) => {
    if (!user?.id) return;
    await createBudget({
      user_id: user.id,
      category: data.category,
      budget_amount: data.budget_amount
    });
  };

  const handleUpdateBudget = async (data: { category: string; budget_amount: number }) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, {
        category: data.category,
        budget_amount: data.budget_amount
      });
      setEditingBudget(null);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(id);
    }
  };

  const handleCreateTransaction = async (data: { category: string; amount: number; description?: string }) => {
    if (!user?.id) return;
    await createTransaction({
      user_id: user.id,
      category: data.category,
      amount: data.amount,
      description: data.description
    });
  };

  const handleEditBudget = (budget: BudgetType) => {
    setEditingBudget(budget);
    setIsBudgetModalOpen(true);
  };

  const handleCloseBudgetModal = () => {
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  };

  const categories = budgetsSummary?.budgets.map(b => b.category) || [];

  if (!isLoaded || (loading && !budgetsSummary)) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your budget data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <Card className="p-8 text-center">
          <div className="text-blue-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Please sign in to access your budget data</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <Card className="p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">ZenVest Budget Planner</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}! Track your spending and manage your budget.
          </p>
          <div className="flex justify-center gap-3 mt-6">
                         <Button
               onClick={() => setIsTransactionModalOpen(true)}
               disabled={categories.length === 0}
               className="bg-green-600 hover:bg-green-700"
             >
              <DollarSign size={20} className="mr-2" />
              Add Transaction
            </Button>
                         <Button onClick={() => setIsBudgetModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus size={20} className="mr-2" />
              Add Budget
            </Button>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Summary */}
        {budgetsSummary && <Summary summary={budgetsSummary} />}

        {/* Budget Cards */}
        {budgetsSummary && budgetsSummary.budgets.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">Budget Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgetsSummary.budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={handleEditBudget}
                  onDelete={handleDeleteBudget}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card className="text-center py-12 mb-8">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">No budgets yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first budget category</p>
            <Button onClick={() => setIsBudgetModalOpen(true)}>Create Budget</Button>
          </Card>
        )}

        {/* Transactions */}
        <TransactionList transactions={transactions} categories={categories} />

        {/* Modals */}
        <BudgetModal
          isOpen={isBudgetModalOpen}
          onClose={handleCloseBudgetModal}
          onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
          editingBudget={editingBudget}
        />
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onSubmit={handleCreateTransaction}
          categories={categories}
        />
      </div>
    </div>
  );
}

export default Budget;
