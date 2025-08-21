export type Expense = { id?: string; category: string; amount: number; date: string; note?: string };

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const headers: HeadersInit = { "Content-Type": "application/json", "X-User-Id": "demo-user" };

export async function getIncome() {
  const res = await fetch(`${API}/api/income`, { headers });
  return res.json();
}

export async function setIncome(amount: number, currency = "INR") {
  const res = await fetch(`${API}/api/income`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ amount, currency, cadence: "monthly" }),
  });
  return res.json();
}

export async function listExpenses() {
  const res = await fetch(`${API}/api/expenses`, { headers });
  return res.json();
}

export async function addExpense(exp: Expense) {
  const res = await fetch(`${API}/api/expenses`, {
    method: "POST",
    headers,
    body: JSON.stringify(exp),
  });
  return res.json();
}

export async function deleteExpense(id: string) {
  const res = await fetch(`${API}/api/expenses/${id}`, { method: "DELETE", headers });
  return res.json();
}

export async function getSummary() {
  const res = await fetch(`${API}/api/summary`, { headers });
  return res.json();
}

export async function getAIAdvice() {
  const res = await fetch(`${API}/api/ai-advice`, { headers });
  return res.json();
}