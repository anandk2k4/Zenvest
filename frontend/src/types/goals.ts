// src/types/goal.ts
export type GoalCategory =
  | "house"
  | "retirement"
  | "education"
  | "investment"
  | "emergency"
  | "vacation"
  | "car"
  | "debt"

export interface Goal {
  id: string
  title: string
  category: GoalCategory
  targetAmount: number
  currentAmount: number
  duration: number
  createdAt: Date
  description?: string
  progressPercentage?: number
}

// Raw backend response
export interface GoalResponse {
  id: string
  title: string
  category: GoalCategory
  target_amount: number
  current_amount: number
  duration: number
  created_at: string
  description?: string
  progress_percentage?: number
}

// Transform backend → frontend
export const normalizeGoal = (g: GoalResponse): Goal => ({
  id: g.id,
  title: g.title,
  category: g.category,
  targetAmount: g.target_amount,   // ✅ camelCase
  currentAmount: g.current_amount,
  duration: g.duration,
  createdAt: new Date(g.created_at),
  description: g.description,
  progressPercentage: g.progress_percentage ?? (g.current_amount / g.target_amount) * 100,
})
