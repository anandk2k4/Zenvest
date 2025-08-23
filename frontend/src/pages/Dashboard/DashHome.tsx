import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { CreditCard,Target, FileText,Bot } from "lucide-react";
import NewsList from "@/components/NewsList";
import { StickyBanner } from "@/components/ui/sticky-banner";



export default function DashHome() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user, isSignedIn } = useUser();

  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [indices, setIndices] = useState<any[]>([]); // ✅ make it an array

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();

        // ✅ Fetch from Express endpoints
        const [summaryRes, goalsRes, newsRes, indicesRes] = await Promise.all([
          fetch(`http://localhost:3001/api/summary?userId=${user?.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:3001/api/goals?userId=${user?.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3001/api/news2", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3001/api/indices") // ← backend for indices
        ]);

        const summaryData = await summaryRes.json();
        const goalsData = await goalsRes.json();
        const newsData = await newsRes.json();
        const indicesData = await indicesRes.json();

        setBudgetSummary(summaryData?.summary || null);
        setGoals(goalsData || []);
        setNews(newsData || []);
        setIndices(Array.isArray(indicesData) ? indicesData : []);

        // ✅ AI Insight: fetch last 3 bot responses
        if (isSignedIn && user) {
          const res = await axios.get(
            `http://localhost:3001/api/chat?userId=${user.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.data?.aiInsights) {
            setAiInsights(res.data.aiInsights);
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

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",'#22C55E'];

  return (<>
    {/* Market Tickers */}
    {/* ✅ Sticky Market Banner */}
    <StickyBanner className="bg-black relative rounded-lg bg-gray-150 dark:bg-black">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-black dark:text-gray-200">
          {indices.length > 0 ? (
            indices.map((idx: any, i: number) => {
              const price = idx?.price ?? "N/A";
              const changePercent =
                typeof idx?.changePercent === "number"
                  ? idx.changePercent
                  : null;

              return (
                <span key={i} className="font-medium">
                  {idx?.name}:{" "}
                  {changePercent !== null ? (
                    <span
                      className={
                        changePercent >= 0 ? "text-green-400" : "text-red-400"
                      }
                    >
                      {price} {changePercent >= 0 ? "▲" : "▼"}{" "}
                      {changePercent.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-gray-400">{price} (no data)</span>
                  )}
                </span>
              );
            })
          ) : (
            <span className="text-gray-400">
              {loading ? "Loading indices..." : "No index data"}
            </span>
          )}
        </div>
      </StickyBanner>

    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Budget Overview */}
        
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
            <CreditCard size={32} className="text-blue-500" />
              <CardTitle>Budget Overview</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/budget")}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full rounded-xl" />
              ) : budgetSummary ? (
                <div className="space-y-4">
                  {/* Income, Expense, Savings cards */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1 bg-gray-100 p-4 rounded-lg shadow text-center dark:bg-indigo-500">
                      <p className="text-black text-sm">Income</p>
                      <p className="text-xl font-semibold">₹{budgetSummary.income}</p>
                    </div>
                    <div className="flex-1 bg-gray-100 p-4 rounded-lg shadow text-center dark:bg-red-600">
                      <p className="text-black text-sm">Expense</p>
                      <p className="text-xl font-semibold">₹{budgetSummary.expenses}</p>
                    </div>
                    <div className="flex-1 bg-gray-100 p-4 rounded-lg shadow text-center dark:bg-emerald-500">
                      <p className="text-black text-sm">Savings</p>
                      <p className="text-xl font-semibold">₹{budgetSummary.savings}</p>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  {budgetSummary.categories.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart className="mt-5">
                        <Pie
                          data={budgetSummary.categories}
                          dataKey="total_amount"
                          nameKey="category"
                          outerRadius={90}
                          labelLine={false}
                          label={({ category, total_amount }) => {
                            const total = budgetSummary.categories.reduce((s: any, c: any): any => s + c.total_amount, 0)
                            const percentage = total > 0 ? (total_amount / total) * 100 : 0
                            return `${category} ${percentage.toFixed(0)}%`
                          }}
                        >
                          {budgetSummary.categories.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-sm">No category data available</p>
                  )}
                </div>
              ) : (
                <p className="text-red-500">Failed to load budget</p>
              )}
            </CardContent>
          </Card>
        
        {/* Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
          <Target size={32} className="text-green-500" />
            <CardTitle>Your Goals</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/goals")}
            >
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
              goals.slice(0, 4).map((g: any) => (
                <div key={g._id} className="mb-5">
                  {/* Title */}
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-medium">{g.title}</span>
                    <span className="text-xs text-gray-500 mt-1">
                      ₹{g.currentAmount} / ₹{g.targetAmount}
                    </span>
                  </div>

                  {/* Progress bar with percentage inside */}
                  <div className="relative">
                    <Progress value={g.progress} />
                    <span className="absolute inset-0 flex justify-center items-center text-xs font-semibold text-gray-700 dark:text-red-500">
                      {g.progress}%
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="text-xs text-gray-500 mt-2">
                    Duration: {g.duration} months
                  </div>
                </div>
              ))
            ) : (
              <p className="text-red-500">No goals found</p>
            )}
          </CardContent>
        </Card>


      </div>

      {/* News */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
        <FileText size={32} className="text-orange-500" />
          <CardTitle>Finance News</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/news")}
          >
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
            <NewsList news={news} />
          ) : (
            <p className="text-red-500">No news available</p>
          )}
        </CardContent>
      </Card>

    </div >
  </>
  );
}

