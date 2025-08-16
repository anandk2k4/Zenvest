import React from 'react';
import type { BudgetsSummary } from '@/types/budget';

interface SummaryProps {
  summary: BudgetsSummary;
}

export const Summary: React.FC<SummaryProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Budget Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 uppercase tracking-wide">Total Budget</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.total_budget)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 uppercase tracking-wide">Total Spent</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_spent)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 uppercase tracking-wide">Remaining</p>
          <p className={`text-2xl font-bold ${summary.total_remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.total_remaining)}
          </p>
        </div>
      </div>
    </div>
  );
};