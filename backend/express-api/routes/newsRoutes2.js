const express = require("express");
const { getLatestNews } = require("../controllers/newsController");

const router = express.Router();

// Read-only endpoint → returns 5 latest news
router.get("/news2", getLatestNews);

module.exports = router;
