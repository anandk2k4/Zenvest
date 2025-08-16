export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export type TimeFrame = { value: number; unit: "months" | "years" };

export type GoalPayload = {
  user_id: string;
  goal_type:
    | "house" | "retirement" | "education" | "investment"
    | "emergency_fund" | "vacation" | "car" | "debt_payoff" | "other";
  target_amount: number;
  current_savings: number;
  time_frame: TimeFrame;
  monthly_income?: number;
  monthly_expenses?: number;
  description?: string;
};

export async function createGoal(payload: GoalPayload) {
  const res = await fetch(`${API_BASE}/api/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ goal_id: string; message: string; ai_advice?: string }>;
}

export async function fetchGoals(userId: string) {
  const res = await fetch(`${API_BASE}/api/goals/${userId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ goals: any[]; total_count: number; message: string }>;
}
