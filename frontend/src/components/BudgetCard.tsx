import React from 'react';
import type { Budget } from '@/types/budget';
import { Edit, Trash2 } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit, onDelete }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);

  const getCardColor = () => {
    if (budget.percentage_spent < 50) return 'border-green-500 bg-green-50';
    if (budget.percentage_spent < 80) return 'border-yellow-500 bg-yellow-50';
    return 'border-red-500 bg-red-50';
  };

  const getProgressColor = () => {
    if (budget.percentage_spent < 50) return 'bg-green-500';
    if (budget.percentage_spent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${getCardColor()}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-800 capitalize">{budget.category}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(budget)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="p-2 text-red-600 hover:bg-red-100 rounded-full"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Budget:</span>
          <span className="font-semibold">{formatCurrency(budget.budget_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Spent:</span>
          <span className="font-semibold">{formatCurrency(budget.spent_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Remaining:</span>
          <span className={`font-semibold ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(budget.remaining)}
          </span>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-semibold">{budget.percentage_spent.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(budget.percentage_spent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};