const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");
const News = require("../models/News");

const router = express.Router();
const cache = new NodeCache({ stdTTL: 1800 }); // 30 min cache

// FastAPI base URL
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000/api/news";

router.get("/news", async (req, res) => {
  const { category } = req.query;
  const cacheKey = `news_${category || "all"}`;

  try {
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    // Call FastAPI
    const fastApiRes = await axios.get(FASTAPI_URL, {
      params: { category }
    });

    let news = fastApiRes.data.articles || [];

    // Save to DB
    for (const article of news) {
      try {
        await News.updateOne(
          { url: article.url },
          { $set: article },
          { upsert: true }
        );
      } catch (e) {
        console.warn("DB save error:", e.message);
      }
    }

    const payload = { articles: news };
    cache.set(cacheKey, payload);
    return res.json(payload);

  } catch (error) {
    console.error("Error fetching from FastAPI:", error.message);

    // ===== DB Fallback =====
    let dbNews = [];

    if (category && category.toLowerCase() === "all") {
      // Pull from all categories
      const cryptoNews = await News.find({ category: "Crypto" }).sort({ publishedAt: -1 }).limit(20).lean();
      const stocksNews = await News.find({ category: "Stocks" }).sort({ publishedAt: -1 }).limit(20).lean();
      const investmentNews = await News.find({ category: "Investment" }).sort({ publishedAt: -1 }).limit(20).lean();

      dbNews = [...cryptoNews, ...stocksNews, ...investmentNews];

      // Sort newest first
      dbNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    } else if (category && category !== "All") {
      // Single category fallback
      dbNews = await News.find({ category }).sort({ publishedAt: -1 }).limit(50).lean();
    }

    if (dbNews.length > 0) {
      return res.json({ articles: dbNews, source: "backup" });
    }

    return res.status(500).json({ error: "Failed to fetch news and no backup" });
  }
});

module.exports = router;
