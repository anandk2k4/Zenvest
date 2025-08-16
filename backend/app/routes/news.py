from fastapi import APIRouter, Query
from dotenv import load_dotenv
import os
import requests
from dateutil import parser  # pip install python-dateutil

load_dotenv()
router = APIRouter()

CRYPTOCOMPARE_API_KEY = os.getenv("CRYPTOCOMPARE_API_KEY")
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")


def fetch_crypto_news(limit=20):
    """Fetch crypto news from CryptoCompare."""
    if not CRYPTOCOMPARE_API_KEY:
        print("❌ CRYPTOCOMPARE_API_KEY missing in .env")
        return []

    url = f"https://min-api.cryptocompare.com/data/v2/news/?lang=EN&api_key={CRYPTOCOMPARE_API_KEY}"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()
        articles = []
        for item in data.get("Data", []):
            articles.append({
                "title": item.get("title"),
                # ✅ Use 'body' for description with fallback
                "description": item.get("body") or "No description available",
                "url": item.get("url"),
                "urlToImage": item.get("imageurl"),
                "publishedAt": item.get("published_on") * 1000 if item.get("published_on") else None,
                "publisher": item.get("source"),
                "category": "Crypto",
                "subCategories": (item.get("categories") or "").split(",")
            })
        return articles[:limit]
    except Exception as e:
        print(f"❌ Error fetching CryptoCompare news: {e}")
        return []


def fetch_gnews(query, category_name, limit=20):
    """Fetch news from GNews API."""
    if not GNEWS_API_KEY:
        print("❌ GNEWS_API_KEY missing in .env")
        return []

    url = f"https://gnews.io/api/v4/search?q={query}&lang=en&max={limit}&apikey={GNEWS_API_KEY}"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()
        articles = []
        for item in data.get("articles", []):
            articles.append({
                "title": item.get("title"),
                # ✅ Use 'description' with fallback
                 "description": item.get("description") or item.get("body") or "No description available",
                "url": item.get("url"),
                "urlToImage": item.get("image"),
                "publishedAt": item.get("publishedAt"),
                "publisher": item.get("source", {}).get("name"),
                "category": category_name,
                "subCategories": []
            })
        return articles
    except Exception as e:
        print(f"❌ Error fetching GNews ({category_name}): {e}")
        return []


def safe_timestamp(val):
    """Convert various date formats to timestamp in ms."""
    try:
        if isinstance(val, int):
            return val
        return int(parser.parse(str(val)).timestamp() * 1000)
    except Exception:
        return 0


@router.get("/news")
def get_news(category: str = Query("All"), limit: int = Query(50)):
    """Main news endpoint with safe error handling."""
    try:
        category_lower = category.lower()

        if category_lower == "crypto":
            return {"articles": fetch_crypto_news(limit)}

        elif category_lower == "stocks":
            return {"articles": fetch_gnews("stocks", "Stocks", limit)}

        elif category_lower == "investment":
            return {"articles": fetch_gnews("investment", "Investment", limit)}

        elif category_lower == "all":
            crypto_news = fetch_crypto_news(limit=15) or []
            stocks_news = fetch_gnews("stocks", "Stocks", limit=15) or []
            investment_news = fetch_gnews("investment", "Investment", limit=15) or []

            combined = crypto_news + stocks_news + investment_news
            combined = [a for a in combined if a.get("publishedAt")]

            combined.sort(key=lambda x: safe_timestamp(x["publishedAt"]), reverse=True)
            return {"articles": combined[:limit]}

        return {"articles": []}

    except Exception as e:
        print(f"❌ get_news error: {e}")
        return {"articles": []}
