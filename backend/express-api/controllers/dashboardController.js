import DashboardSummary from "../models/Budget.js";

// 📌 Read-only: fetch the current month's dashboard summary
export const getLatestDashboardSummary = async (req, res) => {
  try {
    const userId = req.userId || req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }


    // ✅ Fetch summary for current month only
    const summary = await DashboardSummary.findOne({
      user_id: userId,
    })
      .sort({ created_at: -1 })
      .lean();

    if (!summary) {
      return res.json({
        success: true,
        summary: {
          income: 0,
          expenses: 0,
          savings: 0,
          categories: []
        }
      });
    }

    // ✅ Build clean response
    const response = {
      income: summary.current_month_income || 0,
      expenses: summary.current_month_expenses || 0,
      savings: summary.current_month_savings || 0,
      categories: summary.category_breakdown || []
    };

    res.json({ success: true, summary: response });
  } catch (err) {
    console.error("Error fetching dashboard summary:", err);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
};
