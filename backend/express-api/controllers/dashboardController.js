const getDashboardData = (req, res) => {
    res.json({
      totalValue: 125000,
      growthPercent: 8.2,
      monthlyReturns: 9840,
      monthlyGrowthPercent: 12.4,
      riskLevel: "Moderate",
      riskScore: 6,
      goalProgress: 78,
      goalName: "Retirement Goal",
    });
  };
  
  module.exports = { getDashboardData };
  