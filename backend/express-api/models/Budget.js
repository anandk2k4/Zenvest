import mongoose from "mongoose";

const SubCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    transaction_count: { type: Number, required: true },
  },
  { _id: false }
);

const CategorySummarySchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    total_amount: { type: Number, required: true },
    transaction_count: { type: Number, required: true },
    percentage_of_total: { type: Number, required: true },
    sub_categories: { type: [SubCategorySchema], default: [] },
  },
  { _id: false }
);

const MonthlyReportSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    year: { type: Number, required: true },
    total_income: { type: Number, required: true },
    total_expenses: { type: Number, required: true },
    net_savings: { type: Number, required: true },
    top_expense_category: { type: String, required: true },
    expense_trend: { type: String, required: true },
  },
  { _id: false }
);

const DashboardSummarySchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    current_month_income: { type: Number, required: true },
    current_month_expenses: { type: Number, required: true },
    current_month_savings: { type: Number, required: true },
    active_budgets: { type: Number, required: true },

    recent_expenses: { type: Array, default: [] },
    category_breakdown: { type: [CategorySummarySchema], default: [] },
    monthly_trend: { type: [MonthlyReportSchema], default: [] },

    created_at: { type: Date, default: Date.now },
  },
  { collection: "dashboard_summaries" }
);

export default mongoose.model("DashboardSummary", DashboardSummarySchema);