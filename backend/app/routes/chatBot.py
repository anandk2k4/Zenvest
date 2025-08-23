import logging
import json
import re
import time
import os
import requests
import asyncio
import anyio
import cohere
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from jose import jwt
from ..db import get_collection
from ..models.chat_history import ChatHistory
from ..schemas.chatBot import ChatRequest, ChatResponse
from ..services import gemini_service as gemini
from ..services.cohere_service import generate_cohere_response
from ..services.gemini_service import generate_gemini_response
from ..core.config import settings


logger = logging.getLogger(__name__)
router = APIRouter()

# --- External Clients ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-1.5-flash")
co = cohere.Client(os.getenv("COHERE_API_KEY"))

# --- Investment-only filter (unchanged) ---
# --- Investment-only filter ---
ALLOWED_TOPICS = [
    # 🔹 General Investing
    "invest", "investment", "investing", "wealth", "finance", "financial planning",
    "returns", "risk", "roi", "capital gains", "dividends", "valuation",
    "inflation", "interest rate", "compounding", "tax planning", "income tax",

    # 🔹 Stocks & Equity
    "stock", "stocks", "share", "shares", "equity", "ipo", "blue chip", "dividend stock",
    "growth stock", "value stock", "penny stock", "index fund", "etf", "exchange traded fund",

    # 🔹 Bonds & Fixed Income
    "bond", "bonds", "fixed income", "corporate bond", "government bond", 
    "treasury", "debenture", "gilt", "sovereign gold bond", "municipal bond",

    # 🔹 Mutual Funds
    "mutual fund", "mutual funds", "sip", "systematic investment plan",
    "nav", "index fund", "active fund", "passive fund", "fund manager",

    # 🔹 Commodities
    "gold", "silver", "commodity", "oil", "natural gas", "precious metal",
    "agriculture commodity", "energy commodity",

    # 🔹 Crypto & Digital Assets
    "crypto", "cryptocurrency", "bitcoin", "ethereum", "altcoin", "blockchain",
    "token", "stablecoin", "nft", "defi", "crypto wallet", "crypto exchange",

    # 🔹 Real Estate & Alternatives
    "real estate", "reit", "real estate investment trust", "property investing",
    "land", "commercial property", "residential property", "alternative investment",
    "hedge fund", "private equity", "venture capital", "angel investing",

    # 🔹 Retirement & Long-Term Planning
    "retirement", "pension", "provident fund", "epf", "ppf", "401k", "ira", "roth ira",
    "superannuation", "annuity", "gratuity",

    # 🔹 Portfolio Management
    "portfolio", "diversification", "asset allocation", "rebalancing", "hedging",
    "market cap", "large cap", "mid cap", "small cap",

    # 🔹 Budgeting & Saving
    "budget", "budgeting", "emergency fund", "savings account", "fixed deposit", "fd",
    "recurring deposit", "rd", "liquid fund", "cash flow management",

    # 🔹 Insurance (investment-linked)
    "life insurance", "term insurance", "ulip", "endowment policy", "insurance fund",
    "risk cover", "premium", "policy", "sum assured",

    # 🔹 Global Investing
    "nasdaq", "dow jones", "s&p 500", "sensex", "nifty", "foreign investment",
    "fii", "fpi", "emerging markets", "international funds",

    # 🔹 Technical & Market Analysis
    "technical analysis", "fundamental analysis", "candlestick", "chart pattern",
    "support", "resistance", "moving average", "rsi", "macd", "volatility",
    "bull market", "bear market", "market cycle", "correction", "recession",

    # 🔹 Tax & Regulations
    "tax saving", "section 80c", "capital gains tax", "long term capital gains",
    "short term capital gains", "ltcg", "stcg", "gst", "sebi", "sec", "irda",

    # 🔹 Personal Finance
    "debt", "loan", "credit score", "mortgage", "home loan", "car loan",
    "personal loan", "debt payoff", "financial goal",
]

# --- Clerk verification (JWKS cached) ---
_jwks_cache = {"keys": None, "ts": 0}

def _get_jwks():
    now = time.time()
    if _jwks_cache["keys"] and now - _jwks_cache["ts"] < 900:
        return _jwks_cache["keys"]
    if not settings.CLERK_JWKS_URL:
        raise RuntimeError("CLERK_JWKS_URL is not set.")
    resp = requests.get(settings.CLERK_JWKS_URL, timeout=5)
    resp.raise_for_status()
    data = resp.json()
    _jwks_cache.update({"keys": data, "ts": now})
    return data

def _get_unverified_header(token: str):
    return jwt.get_unverified_header(token)

def _find_key(kid: str, jwks: dict):
    return next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)

def _clerk_verify_and_get_user(token: str) -> Optional[str]:
    try:
        header = _get_unverified_header(token)
        jwks = _get_jwks()
        key = _find_key(header.get("kid"), jwks)
        if not key:
            return None
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[header.get("alg", "RS256")],
            issuer=settings.CLERK_ISSUER,
            options={"verify_aud": False},
        )
        return payload.get("sub")
    except Exception as e:
        logger.error("[Clerk] Token verification failed: %s", e)
        return None

async def _resolve_user_id(authorization: Optional[str], body_user_id: Optional[str]) -> str:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        user_id = _clerk_verify_and_get_user(token)
        if user_id:
            return user_id
        logger.warning("[Clerk] Verification failed. Falling back to body userId.")
    if not body_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return body_user_id

def is_investment_related(text: str) -> bool:
    t = text.lower()
    return any(topic in t for topic in ALLOWED_TOPICS)

# --- Response Cleaner ---
def clean_ai_response(raw: str) -> ChatResponse:
    if not raw:
        return ChatResponse(type="text", title="Error", description="No response from AI.")
    if not isinstance(raw, str):
        raw = str(raw)

    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE)
    try:
        parsed = json.loads(cleaned)
        return ChatResponse(**parsed)
    except Exception:
        return ChatResponse(type="text", title="AI Response", description=cleaned)

# --- Save history in background ---
async def save_chat_history(user_id: str, user_query: str, ai_response: ChatResponse):
    coll = get_collection("chat_history")
    try:
        new_msgs = [
            {"role": "user", "text": user_query},
            {"role": "bot", "response": ai_response.dict()}
        ]
        await coll.update_one(
            {"userId": user_id},
            {"$push": {"messages": {"$each": new_msgs}}},
            upsert=True
        )
    except Exception as e:
        logger.exception(f"[MongoDB] Failed to save chat for userId={user_id}: {e}")

# ------------------------------------
@router.post("/chat", response_model=ChatResponse)
async def chat_with_advisor(
    req: ChatRequest,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
):
    user_id = await _resolve_user_id(authorization, req.userId)
    query = req.message.strip()

    if not is_investment_related(query):
        return ChatResponse(
            type="general",
            title="Non-Investment Query",
            description="Your question is outside my scope. I can only provide investment and finance-related information.",
        )

    if not gemini.is_ready():
        raise HTTPException(status_code=500, detail="Gemini not initialized. Check GEMINI_API_KEY.")

    # --- Run Gemini with fallback to Cohere ---
    try:
        ai_response = await generate_gemini_response(query)
    except Exception as e:
        logger.error(f"[Gemini] Failed: {e}")
        try:
            ai_response = await generate_cohere_response(query)
        except Exception as e:
            logger.error(f"[Cohere] Failed: {e}")
            raise HTTPException(status_code=500, detail="AI services unavailable")

    # Clean response
    structured = clean_ai_response(ai_response)

    # Save history in background (non-blocking)
    asyncio.create_task(save_chat_history(user_id, req.message, structured))

    return structured

@router.get("/history/{userId}")
async def get_history(userId: str):
    coll = get_collection("chat_history")
    doc = await coll.find_one({"userId": userId}, projection={"_id": 0})
    if not doc or "messages" not in doc:
        return {"messages": []}

    messages = [
        {"role": msg["role"], "content": msg.get("text") or msg.get("response", {})}
        for msg in doc["messages"]
    ]
    return {"messages": messages}
