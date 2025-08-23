import express from "express";
import { getIndices } from "../controllers/marketController.js";

const router = express.Router();

// GET /api/market/indices
router.get("/indices", getIndices);

export default router;
