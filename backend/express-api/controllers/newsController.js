const News = require("../models/News");

// 📌 Read-only: get latest 5 news
const getLatestNews = async (req, res) => {
  try {
    const news = await News.find()
      .sort({ publishedAt: -1 }) // newest first
      .limit(5)
      .lean();

    res.json(news);
  } catch (err) {
    console.error("Error fetching news:", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};

module.exports = { getLatestNews };
