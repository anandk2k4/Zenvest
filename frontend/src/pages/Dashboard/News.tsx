import React, { useEffect, useState } from "react";
import axios from "axios";

const CATEGORIES = ["All", "Stocks", "Crypto", "Investment"];

interface Article {
  title: string;
  description?: string;
  body?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string | Date;
  publisher?: string;
}

const formatDateTime = (date: Date) => {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${d}/${m}/${y} ${h}:${min}`;
};

const timeAgo = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function News() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [sourceInfo, setSourceInfo] = useState<string | null>(null);

  const fetchNews = async (selectedCategory: string) => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/news", {
        params: { category: selectedCategory }
      });
      setArticles(res.data.articles || []);
      setSourceInfo(res.data.source || null);
    } catch (error) {
      console.error("❌ Error fetching news:", error);
      setArticles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews(category);
  }, [category]);

  useEffect(() => {
    const interval = setInterval(() => setArticles((a) => [...a]), 60000);
    return () => clearInterval(interval);
  }, []);

  const ShimmerCard = () => (
    <div className="flex gap-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow animate-pulse h-40">
      <div className="w-48 h-full bg-gray-300 dark:bg-gray-600"></div>
      <div className="flex flex-col justify-between flex-1 p-4">
        <div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-500 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-500 rounded w-5/6"></div>
        </div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-3"></div>
      </div>
    </div>
  );

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <div className="flex justify-center items-center mb-4">
        <h1 className="text-3xl font-bold mb-5">Finance News</h1>
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <h3 className="ml-6 text-gray-500 mt-1 pb-1 text-lg"><i>Filter :</i></h3>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              category === cat
                ? "bg-green-600 text-white border-emerald-600"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Backup Info */}
      {sourceInfo === "backup" && (
        <div className="bg-yellow-100 dark:bg-yellow-800 border border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded mb-4">
          Showing saved news due to API outage.
        </div>
      )}

      {/* News List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p>No articles found.</p>
      ) : (
        <div className="space-y-4">
          {articles.map((article, idx) => {
            const pubDate = new Date(article.publishedAt);
            const newsText =
              article.description && article.description.trim() !== "" && article.description !== "No description available"
                ? article.description
                : article.body && article.body.trim() !== ""
                ? article.body
                : "No description available";

            return (
              <div
                key={idx}
                className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow hover:shadow-lg transition-shadow h-40"
              >
                {article.urlToImage ? (
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    className="w-48 h-full object-cover flex-shrink-0"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="w-48 h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No Image
                  </div>
                )}

                <div className="p-4 flex flex-col justify-between flex-1 overflow-hidden">
                  <div className="overflow-hidden">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {article.title}
                    </h2>
                    <p
                      className={`text-sm mt-1 ${
                        newsText !== "No description available"
                          ? "text-gray-700 dark:text-gray-300 line-clamp-3"
                          : "text-gray-500 dark:text-gray-400 italic"
                      }`}
                    >
                      {newsText}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                    <span>
                      {formatDateTime(pubDate)} • {article.publisher || "Unknown"} • {timeAgo(pubDate)}
                    </span>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 dark:text-green-400 font-medium hover:underline"
                    >
                      Read more →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
