import { useState, useEffect } from "react"
import {
  Plus,
  Target,
  Home,
  GraduationCap,
  TrendingUp,
  Shield,
  Plane,
  Car,
  CreditCard,
  Edit3,
  Trash2,
  Bot,
  Calculator,
  CheckCircle,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApi } from "@/utils/api"
import { useAuth } from "@clerk/clerk-react"
import type { Goal, GoalResponse } from "@/types/goals"
import { normalizeGoal } from "@/types/goals"
import ReactMarkdown from "react-markdown"


// Types
type GoalCategory = "house" | "retirement" | "education" | "investment" | "emergency" | "vacation" | "car" | "debt"


interface AIInsight {
  type: "suggestion" | "calculation" | "progress"
  title: string
  content: string | string[]
  actionable?: string | string[]
}
export interface AIQuery extends AIInsight {
  query: string
}

interface UserProfile {
  age: number
  monthlyIncome: number
  monthlyExpenses: number
  dependents: number
}

const GoalTrackingPage = () => {
  const { get, post, put, del } = useApi()
  const { getToken } = useAuth()   // ✅ Clerk hook

  const [goals, setGoals] = useState<Goal[]>([])
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [aiQueries, setAiQueries] = useState<AIQuery[]>([])
  const [aiQuery, setAiQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [userProfile] = useState<UserProfile>({
    age: 28,
    monthlyIncome: 75000,
    monthlyExpenses: 45000,
    dependents: 0,
  })

  const goalCategories: Record<GoalCategory, { icon: any; label: string; color: string }> = {
    house: { icon: Home, label: "House", color: "bg-blue-500" },
    retirement: { icon: Target, label: "Retirement", color: "bg-purple-500" },
    education: { icon: GraduationCap, label: "Education", color: "bg-green-500" },
    investment: { icon: TrendingUp, label: "Investment", color: "bg-orange-500" },
    emergency: { icon: Shield, label: "Emergency Fund", color: "bg-red-500" },
    vacation: { icon: Plane, label: "Vacation", color: "bg-cyan-500" },
    car: { icon: Car, label: "Car", color: "bg-yellow-500" },
    debt: { icon: CreditCard, label: "Debt Payoff", color: "bg-gray-500" },
  }

  // API calls with Clerk token
  const fetchGoals = async () => {
    try {
      const token = await getToken()
      const response: GoalResponse[] = await get("http://localhost:8000/api/goals/goal", {
        headers: { Authorization: `Bearer ${token}` },
      })

      setGoals(response.map(normalizeGoal))

    } catch (error) {
      console.error("Failed to fetch goals:", error)
    }
  }

  const getAISuggestions = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const response = await get("http://localhost:8000/api/ai/suggestions", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = Array.isArray(response) ? response[0] : response

      // helper to clean up text
      const cleanText = (text: string) =>
        text
          ?.replace(/^\d+\.\s*•?\s*/, "") // remove leading "1. •" or "2."
          .trim()

      // console.log("AI Suggestions Response:", response)
      const insight: AIInsight = {
        type: "suggestion",
        title: `Savings Plan: ${response[0].title}`,
        content: cleanText(data.content), // now array of bullets
        actionable: cleanText(data.actionable), // array of bullets
      }
      setAiInsights((prev) => [insight, ...prev])
    } catch (error) {
      console.error("Failed to get AI suggestions:", error)
    } finally {
      setLoading(false)
    }
  }


  // ✅ Helper: Format AI suggestions into a bullet point array
  const formatActionables = (text: string, maxPoints = 5): string[] => {
    if (!text) return []

    return text
      .replace(/\n+/g, " ")       // collapse newlines
      .replace(/\s+/g, " ")       // normalize spaces
      .replace(/Here.*?:/i, "")   // remove intros like "Here is a concise response:"
      .replace(/\d+\.\s*/g, "")   // remove numbered sections (1., 2., etc.)
      .split(/[-•]\s+/)           // split where items start with "-" or "•"
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        // ✂️ only take the first sentence to keep bullets short
        return line.split(/[.!?]/)[0]
      })
      .slice(0, maxPoints)
  }

  // ✅ Helper: Format numeric summary into bullet points
  const formatContent = (response: any): string[] => {
    return [
      `Monthly Required: ₹${response.monthly_required.toLocaleString()}`,
      `Total Remaining: ₹${response.total_remaining.toLocaleString()}`,
      `Months Remaining: ${response.months_remaining}`,
      `Expected Returns: ${response.expected_returns}`,
    ]
  }

  const calculateSavingsPlan = async (goal: Goal) => {
    setLoading(true)
    try {
      const token = await getToken()
      const response = await post(
        "http://localhost:8000/api/ai/calculate-savings",
        {
          goal_id: goal.id,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          duration_months: goal.duration,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const insight: AIInsight = {
        type: "calculation",
        title: `Savings Plan: ${goal.title}`,
        content: formatContent(response), // now array of bullets
        actionable: formatActionables(response.suggested_investment), // array of bullets
      }

      // Update insights list
      setAiInsights((prev) => [insight, ...prev])

      // Update the goal with this AI insight so the UI card shows it
      setGoals((prevGoals) =>
        prevGoals.map((g) =>
          g.id === goal.id ? { ...g, ai_insight: insight } : g
        )
      )
    } catch (error) {
      console.error("Failed to calculate savings plan:", error)
    } finally {
      setLoading(false)
    }
  }




  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return
    setLoading(true)
    try {
      const token = await getToken()
      const response = await post(
        "http://localhost:8000/api/ai/query",
        { query: aiQuery },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      console.log(response)
      // Convert raw text into bullet list if it contains bullet markers
      const formatContent = (text: string): string[] | string => {
        if (!text) return ""

        // Remove outer <p>...</p>
        let cleaned = text.replace(/^<p>|<\/p>$/g, "").trim()

        // Split into bullet points if `•` exists
        if (cleaned.includes("\n\n")) {
          return cleaned
            .split("\n\n")
            .map(line => line.trim())
            .filter(Boolean) // remove empty strings
        }

        // Otherwise return plain string (paragraph)
        return cleaned
      }

      // Store structured query with raw response in Ask AI tab
      const queryData: AIQuery = {
        query: aiQuery,     // make sure backend sends this
        type: "calculation",
        title: "AI Response",
        content: formatContent(response.content),     // string[]
        actionable: response.actionable, // string[]
      }
      setAiQueries([queryData, ...aiQueries])

      // // Store only structured insight in Insights tab
      // const insight: AIInsight = {
      //   type: "calculation",
      //   title: "AI Response",
      //   content: response.content,
      //   actionable: response.actionable,
      // }
      // setAiInsights([insight, ...aiInsights])

      setAiQuery("")
    } catch (error) {
      console.error("Failed to query AI:", error)
    } finally {
      setLoading(false)
    }
  }

  const addGoal = async (goalData: any) => {
    try {
      const token = await getToken()
      const newGoal: GoalResponse = await post("http://localhost:8000/api/goals/goal", goalData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setGoals([...goals, normalizeGoal(newGoal)])
      setShowAddGoal(false)
    } catch (error) {
      console.error("Failed to add goal:", error)
    }
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal> = {}) => {
    try {
      const token = await getToken()
      const updatedGoal: GoalResponse = await put(
        `http://localhost:8000/api/goals/goal/${goalId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setGoals(goals.map((goal) => (goal.id === goalId ? normalizeGoal(updatedGoal) : goal)))
    } catch (error) {
      console.error("Failed to update goal:", error)
    }
  }

  const deleteGoal = async (goalId: string) => {
    try {
      const token = await getToken()
      await del(`http://localhost:8000/api/goals/goal/${goalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // ✅ remove from state
      setGoals(goals.filter((goal) => goal.id !== goalId))
    } catch (error) {
      console.error("Failed to delete goal:", error)
    }
  }


  const getProgressStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage >= 100) return { status: "completed", color: "text-green-600" }
    if (percentage >= 75) return { status: "on-track", color: "text-blue-600" }
    if (percentage >= 25) return { status: "progress", color: "text-orange-600" }
    return { status: "behind", color: "text-red-600" }
  }

  useEffect(() => {
    fetchGoals()
    getAISuggestions()
  }, [])


  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100">Financial Goals</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and optimize your financial objectives with AI-powered insights</p>
          </div>
        </div>

        {/* Goals + AI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Goals Section */}
          <Card className="h-fit ">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Goals ({goals.length})
              </CardTitle>
              <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-green-400 text-white text-md hover:bg-green-600">
                    <Plus className="h-4 w-4" />
                    Add Goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Goal</DialogTitle>
                  </DialogHeader>
                  <AddGoalForm onSubmit={addGoal} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-120 overflow-y-auto">
                {goals.map((goal) => {
                  const category = goalCategories[goal.category]
                  const IconComponent = category.icon
                  const progress = (goal.currentAmount / goal.targetAmount) * 100
                  const status = getProgressStatus(goal.currentAmount, goal.targetAmount)

                  return (
                    <Card key={goal.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${category.color} text-white`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{goal.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {category.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => calculateSavingsPlan(goal)}>
                              <Calculator className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => updateGoal(goal.id)}>
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className={`font-medium ${status.color}`}>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>₹{goal.currentAmount.toLocaleString()}</span>
                            <span>₹{goal.targetAmount.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-gray-500">Duration: {goal.duration} months</div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant Panel */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                AI Financial Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="insights" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="chat">Ask AI</TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-4">
                  {loading && (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}

                  <div className="max-h-[80vh] overflow-y-auto space-y-3">
                    {aiInsights.map((insight, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2">
                            {insight.type === "suggestion" && (
                              <Info className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                            )}
                            {insight.type === "calculation" && (
                              <Calculator className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                            )}
                            {insight.type === "progress" && (
                              <TrendingUp className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                            )}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-[15px]">{insight.title}</h4>

                              {/* Content */}
                              {insight?.content && Array.isArray(insight.content) ? (
                                <ul className="list-disc pl-5 mt-2 mb-4 space-y-1 text-left ">
                                  {insight.content.map((point: string, idx: number) => (
                                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-400">
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              ) : insight?.content ? (
                                <p className="text-sm text-gray-700 dark:text-gray-400">{insight.content as string}</p>
                              ) : null}


                              {/* actionable */}
                              {insight?.actionable && Array.isArray(insight.actionable) ? (
                                <div className="bg-emerald-100 p-2 rounded-[18px] text-[15px] dark:bg-green-500">
                                  <strong>Action:</strong>
                                  <ul className="list-disc pl-5 mt-3 space-y-1 text-left">
                                    {insight.actionable.map((point: string, idx: number) => (
                                      <li key={idx} className="text-sm text-gray-700 dark:text-black">
                                        {point}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : insight?.actionable ? (
                                <div className="bg-emerald-100 p-2 rounded-[18px] text-[15px] dark:bg-green-500">
                                  <strong className="pr-2">Action:</strong>
                                  <div className="text-sm prose prose-sm max-w-none dark:prose-invert dark: text-black">
                                    <ReactMarkdown>{insight.actionable as string}</ReactMarkdown>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>


                  <Button onClick={getAISuggestions} variant="outline" className="w-full bg-transparent" disabled={loading}>
                    Get New Suggestions
                  </Button>
                </TabsContent>

                <TabsContent value="chat" className="space-y-4">
                  <div className="max-h-[80vh] overflow-y-auto space-y-3">
                    {/* Input box and button */}
                    <Textarea
                      placeholder="Ask me anything about your finances... e.g., 'What if I save ₹10,000/month for 5 years?'"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      onClick={handleAIQuery}
                      disabled={loading || !aiQuery.trim()}
                      className="w-full"
                    >
                      {loading ? "Thinking..." : "Ask AI Assistant"}
                    </Button>
                    {aiQueries.length > 0 ? (
                      <div className="mt-4 space-y-4">
                        {aiQueries.map((query, idx) => (
                          <Card key={idx} className="border-l-4 border-l-blue-500 dark:border-blue-500 ">
                            <CardContent className="p-6">
                              <div
                                key={idx}
                                className="p-3 border rounded-xl bg-white shadow-sm dark:bg-gray-900"
                              >
                                {query.query && (
                                  <>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">You asked:</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {query.query}
                                    </p>
                                  </>
                                )}
                                {/* Content */}
                                {query?.content && Array.isArray(query.content) ? (
                                  <ul className="list-disc pl-5 mt-2 mb-4 space-y-1 text-left ">
                                    {query.content.map((point: string, idx: number) => (
                                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-400">
                                        {point}
                                      </li>
                                    ))}
                                  </ul>
                                ) : query?.content ? (
                                  <p className="text-sm text-gray-700 dark:text-gray-400">{query.content as string}</p>
                                ) : null}


                                {/* actionable */}
                                {query?.actionable && Array.isArray(query.actionable) ? (
                                  <div className="bg-emerald-100 p-2 rounded-[18px] text-[15px] dark:bg-green-500">
                                    <strong>Action:</strong>
                                    <ul className="list-disc pl-5 mt-3 space-y-1 text-left">
                                      {query.actionable.map((point: string, idx: number) => (
                                        <li key={idx} className="text-sm text-gray-700 dark:text-black">
                                          {point}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : query?.actionable ? (
                                  <div className="bg-emerald-100 p-2 rounded-[18px] text-[15px] dark:bg-green-500">
                                    <strong className="pr-2">Action:</strong>
                                    <div className="text-sm prose prose-sm max-w-none dark:prose-invert dark: text-black">
                                      <ReactMarkdown>{query.actionable as string}</ReactMarkdown>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Nothing asked yet. Try asking a question above!
                      </p>
                    )}
                  </div>
                </TabsContent>


              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2 ">
                <div className="flex items-center gap-2 pl-11">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Goals</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-blue-500">{goals.length}</div>
                <div className="text-xs text-gray-500">Active goals</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 pl-11">
                  <TrendingUp className="h-4 w-4 text-orange-600 " />
                  <span className="text-sm text-gray-600 ">Total Target</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-red-500">
                  ₹{(goals.reduce((sum, goal) => sum + goal.targetAmount, 0) / 100000).toFixed(1)}L
                </div>
                <div className="text-xs text-gray-500 dark:text-red-500">
                  ₹{goals.reduce((sum, goal) => sum + goal.targetAmount, 0).toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 pl-11">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Total Saved</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ₹{(goals.reduce((sum, goal) => sum + goal.currentAmount, 0) / 100000).toFixed(1)}L
                </div>
                <div className="text-xs text-gray-500">
                  ₹{goals.reduce((sum, goal) => sum + goal.currentAmount, 0).toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 pl-9">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Monthly Surplus</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{((userProfile.monthlyIncome - userProfile.monthlyExpenses) / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-gray-500">Available to invest</div>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-lg mb-4">Overall Progress</h3>

              <div className="space-y-4">
                {goals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100
                  const category = goalCategories[goal.category]
                  const IconComponent = category.icon

                  return (
                    <div key={goal.id} className="flex items-center gap-4">
                      {/* Icon + Category */}
                      <div
                        className={`p-2 rounded-lg ${category.color} text-white flex-shrink-0`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>

                      {/* Goal Title + Progress Bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm truncate">
                            {goal.title}
                          </span>
                          <span className="text-sm text-gray-600">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Amount Display */}
                      <div className="text-right text-xs text-gray-500 flex-shrink-0">
                        <div>₹{(goal.currentAmount / 1000).toFixed(0)}K</div>
                        <div>of ₹{(goal.targetAmount / 1000).toFixed(0)}K</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div >
  )
}

type NewGoalInput = {
  title: string
  category: string
  targetAmount: number
  currentAmount: number
  duration: number
  description?: string
}

// Add Goal Form Component
const AddGoalForm = ({ onSubmit }: { onSubmit: (data: NewGoalInput) => void }) => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    targetAmount: "",
    currentAmount: "",
    duration: "",
    description: "",
  })

  const handleSubmit = () => {
    if (!formData.title || !formData.category || !formData.targetAmount || !formData.duration || !formData.currentAmount) {
      return
    }

    onSubmit({
      ...formData,
      targetAmount: Number.parseInt(formData.targetAmount),
      currentAmount: Number.parseInt(formData.currentAmount),
      duration: Number.parseInt(formData.duration),
    })

    setFormData({
      title: "",
      category: "",
      targetAmount: "",
      currentAmount: "",
      duration: "",
      description: "",
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Goal Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Dream Home"
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="retirement">Retirement</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="investment">Investment</SelectItem>
            <SelectItem value="emergency">Emergency Fund</SelectItem>
            <SelectItem value="vacation">Vacation</SelectItem>
            <SelectItem value="vehicle">Vehicle</SelectItem>
            <SelectItem value="debt">Debt Payoff</SelectItem>
            <SelectItem value="other">Others</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="targetAmount">Target Amount (₹)</Label>
        <Input
          id="targetAmount"
          type="number"
          value={formData.targetAmount}
          onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
          placeholder="500000"
        />
      </div>

      <div>
        <Label htmlFor="targetAmount">Current Saving Amount (₹)</Label>
        <Input
          id="currentAmount"
          type="number"
          value={formData.currentAmount}
          onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
          placeholder="500000"
        />
      </div>

      <div>
        <Label htmlFor="duration">Duration (months)</Label>
        <Input
          id="duration"
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          placeholder="24"
        />
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of your goal"
        />
      </div>

      <Button onClick={handleSubmit} className="w-full">
        Create Goal
      </Button>
    </div>
  )
}

export default GoalTrackingPage
