import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

export default function DashHome() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user, isSignedIn } = useUser();

  const [budget, setBudget] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();

        // Budget, Goals, News
        const [budgetRes, goalsRes, newsRes] = await Promise.all([
          fetch("http://localhost:8000/api/budget/expenses/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/api/goals/goal", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/api/news", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setBudget(await budgetRes.json());
        setGoals(await goalsRes.json());
        setNews(await newsRes.json());

        // ✅ AI Insight: use chatBot history
        if (isSignedIn && user) {
          const res = await axios.get(
            `http://localhost:8000/api/chatBot/history/${user.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.data?.messages && res.data.messages.length > 0) {
            // last bot message
            const lastBotMsg = [...res.data.messages]
              .reverse()
              .find((m) => m.role === "bot");

            if (lastBotMsg) {
              setAiInsight(lastBotMsg.content);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken, isSignedIn, user]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="p-6 space-y-6">
      {/* Market Tickers */}
      <Card>
        <CardHeader>
          <CardTitle>Market Tickers</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-6 text-sm text-gray-600 dark:text-gray-300">
          <span>NIFTY 50: 22,350 ▲ 1.2%</span>
          <span>SENSEX: 74,800 ▼ 0.8%</span>
          <span>NASDAQ: 14,520 ▲ 0.5%</span>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Budget Overview</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/budget")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : budget ? (
              <div>
                <p className="text-sm mb-2">
                  Income: ₹{budget.income} | Expense: ₹{budget.expense}
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={budget.categories} dataKey="amount" outerRadius={80} label>
                      {budget.categories.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-red-500">Failed to load budget</p>
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Goals</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/goals")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full rounded-xl" />
                <Skeleton className="h-6 w-full rounded-xl" />
                <Skeleton className="h-6 w-full rounded-xl" />
              </div>
            ) : goals.length > 0 ? (
              goals.slice(0, 4).map((g: any) => {
                const percent = Math.round((g.current_amount / g.target_amount) * 100);
                return (
                  <div key={g.id} className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span>{g.name}</span>
                      <span>{percent}%</span>
                    </div>
                    <Progress value={percent} />
                  </div>
                );
              })
            ) : (
              <p className="text-red-500">No goals found</p>
            )}
          </CardContent>
        </Card>

        {/* News */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Finance News</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/news")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-full rounded-xl" />
                <Skeleton className="h-5 w-full rounded-xl" />
                <Skeleton className="h-5 w-full rounded-xl" />
              </div>
            ) : news.length > 0 ? (
              <ul className="space-y-2">
                {news.slice(0, 5).map((n: any) => (
                  <li
                    key={n.id}
                    className="text-sm cursor-pointer hover:underline"
                    onClick={() => navigate(`/news/${n.id}`)}
                  >
                    {n.title}{" "}
                    <span className="text-xs text-gray-500">({n.source})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-red-500">No news available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI Insight</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/ai")}>
            Go to AI
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : aiInsight ? (
            <div>
              <h3 className="font-medium mb-1">{aiInsight.title || "Last Suggestion"}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {aiInsight.description || aiInsight}
              </p>
            </div>
          ) : (
            <p className="text-red-500">No AI suggestions found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
