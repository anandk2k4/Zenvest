// backend/express/routes/protectedRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const axios = require("axios");

/**
 * Simple protected Express route (handled entirely by Express)
 */
router.get("/profile", authMiddleware, async (req, res) => {
  // req.user is set by middleware
  // You can read user id/email here: req.user.id / req.user.email
  return res.json({
    message: "Hello from Express protected route",
    user: req.user,
  });
});

/**
 * Example: proxy to FastAPI while preserving Authorization header
 * Frontend calls: GET /api/fetch-from-python  (with Authorization header)
 * Express verifies token, then forwards request to FastAPI with same token
 */
router.get("/fetch-from-python", authMiddleware, async (req, res) => {
  try {
    // forward the original Authorization header to FastAPI
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000/data";
    const authHeader = req.headers["authorization"] || `Bearer ${req.headers["x-access-token"]}`;

    const response = await axios.get(fastApiUrl, {
      headers: {
        Authorization: authHeader,
        // alternatively send user info in headers:
        "x-user-id": req.user.id || req.user.sub || "",
        "x-user-email": req.user.email || "",
      },
    });

    return res.json(response.data);
  } catch (err) {
    console.error("Error proxying to FastAPI:", err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    return res.status(status).json({ message: "Error fetching from FastAPI", error: err?.response?.data || err.message });
  }
});

module.exports = router;
