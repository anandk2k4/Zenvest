import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import axios from "axios";

const Url = import.meta.env.VITE_API_URL

const DashboardHome = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(`${Url}/api/dashboard`);
        setData(response.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchDashboard();
  }, []);

  if (!data) return <div className="text-center p-6 text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Portfolio Value */}
      <Card>
        <CardHeader>
          <CardDescription>Total Portfolio Value</CardDescription>
          <CardTitle className="text-2xl">${data.totalValue.toLocaleString()}</CardTitle>
          <p className="text-sm text-green-600 mt-1">
            ↑ {data.growthPercent}% this month
          </p>
        </CardHeader>
      </Card>

      {/* Monthly Returns */}
      <Card>
        <CardHeader>
          <CardDescription>Monthly Returns</CardDescription>
          <CardTitle className="text-2xl">+${data.monthlyReturns.toLocaleString()}</CardTitle>
          <p className="text-sm text-green-600 mt-1">
            ↑ {data.monthlyGrowthPercent}% vs last month
          </p>
        </CardHeader>
      </Card>

      {/* Risk Score */}
      <Card>
        <CardHeader>
          <CardDescription>Risk Score</CardDescription>
          <CardTitle className="text-2xl">{data.riskLevel}</CardTitle>
          <div className="h-2 bg-gray-300 rounded-full mt-2">
            <div
              className="h-2 bg-yellow-500 rounded-full"
              style={{ width: `${(data.riskScore / 10) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{data.riskScore}/10 Risk Level</p>
        </CardHeader>
      </Card>

      {/* Goal Progress */}
      <Card>
        <CardHeader>
          <CardDescription>Goal Progress</CardDescription>
          <CardTitle className="text-2xl">{data.goalProgress}%</CardTitle>
          <div className="h-2 bg-gray-300 rounded-full mt-2">
            <div
              className="h-2 bg-purple-500 rounded-full"
              style={{ width: `${data.goalProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{data.goalName}</p>
        </CardHeader>
      </Card>
    </div>
  );
};

export default DashboardHome;
