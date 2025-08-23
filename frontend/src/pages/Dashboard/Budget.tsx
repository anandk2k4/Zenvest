import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Sector, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { IndianRupee, TrendingUp, TrendingDown, Plus, Brain, Target, AlertTriangle } from "lucide-react"
import { useApi } from "@/utils/api"   // ✅ our axios-based API hook
import { useAuth } from "@clerk/clerk-react"

// ---------------- Types ----------------
interface ExpenseCategorySummary {
  category: string
  total_amount: number
  transaction_count: number
  percentage_of_total: number
}

interface DashboardSummary {
  current_month_income: number
  current_month_expenses: number
  current_month_savings: number
  category_breakdown: ExpenseCategorySummary[]
}

interface AIAdvice {
  advice_type: string
  title: string
  message: string
  priority: string
  action_items: string[]
  potential_savings?: number
}

// ---------------- Constants ----------------
const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Other",
]

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316", "#6b7280"]

// ---------------- Component ----------------
export default function BudgetDashboard() {
  const api = useApi() // ✅ useApi hook
  const { getToken } = useAuth()

  const [income, setIncome] = useState<number>(0)
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategorySummary[]>([])
  const [savings, setSavings] = useState<number>(0)
  const [isOverBudget, setIsOverBudget] = useState(false)
  const [aiAdvice, setAiAdvice] = useState<AIAdvice[]>([])
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [newExpense, setNewExpense] = useState({ category: "", amount: "" })
  const [showIncomeForm, setShowIncomeForm] = useState<boolean | null>(null)
  const [showDeficitAlert, setShowDeficitAlert] = useState(false)
  

  // 🔹 Fetch dashboard summary
  const fetchDashboardData = async () => {
    try {
      const data = await api.get<DashboardSummary>("http://localhost:8000/api/dashboard/summary")

      if (data.current_month_income && data.current_month_income > 0) {
        // ✅ user already has income
        setIncome(data.current_month_income)
        setSavings(data.current_month_savings)
        setExpensesByCategory(data.category_breakdown)
        setIsOverBudget(data.current_month_expenses >= data.current_month_income)
        setShowIncomeForm(false)
      } else {
        // ❌ no income yet
        setShowIncomeForm(true)
      }
    } catch (err) {
      console.error("Dashboard fetch failed:", err)
      setShowIncomeForm(true) // fallback → ask for income
    }
  }

  
  useEffect(() => {
    fetchDashboardData()
  }, [])

   // ⚠️ New: Trigger deficit alert
   useEffect(() => {
    if (savings < 0) {
      setShowDeficitAlert(true)
    }
  }, [savings])

  // 🔹 Submit Income
  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const incomeValue = Number.parseFloat(formData.get("income") as string)
    if (incomeValue > 0) {
      try {
        await api.post("http://localhost:8000/api/income/budget", {
          amount: incomeValue,
          type: "Salary",
          source: "manual",
        })
        fetchDashboardData()
      } catch (err) {
        console.error("Income submit failed:", err)
      }
    }
  }

  // 🔹 Submit Expense
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newExpense.category && newExpense.amount) {
      const token = await getToken()
      try {
        await api.post("http://localhost:8000/api/expense/budget", {
          category: newExpense.category,
          amount: Number.parseFloat(newExpense.amount),
          description: "Added from dashboard",
        }, { headers: { Authorization: `Bearer ${token}` } }
        )
        setNewExpense({ category: "", amount: "" })
        setShowExpenseDialog(false)
        fetchDashboardData()
      } catch (err) {
        console.error("Expense submit failed:", err)
      }
    }
  }

  // ---------------- UI ----------------
  if (showIncomeForm === null) {
    return (
      <div className="h-130 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }
  if (showIncomeForm) {
    return (
      <div className="h-140 flex items-center justify-center p-4 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">ZenVest Budget Planner</CardTitle>
            <CardDescription>Let's start by setting up your monthly income</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIncomeSubmit} className="space-y-4">
              <div>
                <Label htmlFor="income">Monthly Income (Rs.)</Label>
                <Input
                  id="income"
                  name="income"
                  type="number"
                  placeholder="Enter your monthly income"
                  min="0"
                  step="0.0"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Continue to Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* --- HEADER --- */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100">ZenVest Budget Planner</h1>
          <p className="text-gray-600">Take control of your finances with intelligent insights</p>
        </div>

        {/* --- METRIC CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Income */}
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <IndianRupee className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {income.toFixed(2)}</div>
              <p className="text-xs text-emerald-100">Your total monthly income</p>
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card className={`${isOverBudget ? "bg-gradient-to-r from-red-500 to-red-600 text-white" : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              {isOverBudget ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹ {expensesByCategory.reduce((sum, c) => sum + c.total_amount, 0).toFixed(2)}
              </div>
              <p className="text-xs opacity-90">
                {isOverBudget ? "Over budget!" : `${((expensesByCategory.reduce((s, c) => s + c.total_amount, 0) / income) * 100).toFixed(1)}% of income`}
              </p>
            </CardContent>
          </Card>

          {/* Savings */}
          <Card className={`${savings >= 0 ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : "bg-gradient-to-r from-orange-500 to-orange-600 text-white"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings</CardTitle>
              <Target className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {savings.toFixed(2)}</div>
              <p className="text-xs opacity-90">{savings >= 0 ? "Great job saving!" : "Deficit this month"}</p>
            </CardContent>
          </Card>
        </div>


        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Breakdown of your spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, total_amount }) => {
                        const total = expensesByCategory.reduce((s, c) => s + c.total_amount, 0)
                        const percentage = total > 0 ? (total_amount / total) * 100 : 0
                        return `${category} ${percentage.toFixed(0)}%`
                      }}
                      outerRadius={80}
                      dataKey="total_amount"
                    >
                      {expensesByCategory.map((entry, index) => {
                        // find max slice
                        const maxValue = Math.max(...expensesByCategory.map(e => e.total_amount))
                        const isMax = entry.total_amount === maxValue
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isMax ? "red" : COLORS[index % COLORS.length]}
                          />
                        )
                      })}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">No expenses recorded yet</div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Comparison</CardTitle>
              <CardDescription>Compare spending across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expensesByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Amount"]} />
                    <Bar dataKey="total_amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">No expenses recorded yet</div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* --- Add Expense Dialog --- */}
        <div className="fixed bottom-6 right-6">
          <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full text-[15px] shadow-lg bg-emerald-500 hover:bg-emerald-700 dark:bg-emerald-400 dark:hover:bg-green-400">
                <Plus className="h-5 w-5" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new expense to track your spending</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Add Expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}