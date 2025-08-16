from typing import List, Dict
from ..core.config import settings
import google.generativeai as genai

SYSTEM_RULES = """
You are ZenVest — an investment-only AI advisor for India-focused and global markets.
STRICTLY refuse non-investment questions (politics, jokes, weather, coding, etc).
When relevant, discuss: stocks, indices (NIFTY/SENSEX), ETFs, crypto, gold, bonds, mutual funds,
asset allocation, risk, time horizon, SIPs, tax-aware investing basics (no legal/tax advice).
Be concise, structured, and cite data you were given (news headlines, prices).
Add a short risk disclaimer at the end: "Not financial advice. Do your own research."
If user asks for stock tips, give frameworks (valuation, risk, diversification) and scenarios,
not guarantees. Avoid personal data. Never fabricate live numbers — only use provided data.
"""

INVESTMENT_KEYWORDS = {
    "stock","stocks","share","shares","equity","market","markets","trading","invest",
    "investment","investing","portfolio","mutual fund","mf","sip","nav","nifty","sensex",
    "etf","index","indices","derivative","options","futures","bond","bonds","gold",
    "crypto","bitcoin","btc","ethereum","eth","forex","currencies","commodities"
}

def is_investment_related(text: str) -> bool:
    t = text.lower()
    return any(k in t for k in INVESTMENT_KEYWORDS)

def _build_prompt(user_message: str, news: List[Dict], quotes: List[Dict]) -> str:
    news_lines = []
    for n in news[:6]:
        news_lines.append(f"- {n.get('title')} ({n.get('source')}, {n.get('published_at')}) → {n.get('url')}")
    quote_lines = []
    for q in quotes[:10]:
        quote_lines.append(f"- {q.get('symbol')}: {q.get('price')} ({q.get('changesPercentage')}%)")

    return f"""
{SYSTEM_RULES}

User question:
{user_message}

Latest quotes (subset):
{chr(10).join(quote_lines) if quote_lines else "- (none)"}

Trending investment news (subset):
{chr(10).join(news_lines) if news_lines else "- (none)"}

Instructions:
- Use ONLY the data above for any live numbers.
- If a symbol is missing, say you don't have that live quote and suggest adding it.
- Provide a short, actionable summary with steps or scenarios (bull/base/bear) when relevant.
- Add 2-3 bullet risk notes if the topic is volatile (e.g., crypto, smallcaps).
"""
    
def generate_answer(user_message: str, news: List[Dict], quotes: List[Dict]) -> str:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(model_name="gemini-1.5-pro")
    prompt = _build_prompt(user_message, news, quotes)
    resp = model.generate_content(prompt)
    return resp.text.strip() if resp and getattr(resp, "text", None) else "Sorry — I couldn't generate an answer right now."
