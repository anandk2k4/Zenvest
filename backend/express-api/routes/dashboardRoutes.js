import express from "express";
import { getLatestDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();

// Read-only endpoint: latest summary for a user
router.get("/summary", getLatestDashboardSummary);

export default router;
