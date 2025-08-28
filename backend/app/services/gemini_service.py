import os
import logging
import google.generativeai as genai
from ..core.config import settings

logger = logging.getLogger(__name__)

_model = None

def init_gemini() -> None:
    global _model
    if not settings.GEMINI_API_KEY:
        logger.error("[Gemini] GEMINI_API_KEY missing in environment.")
        return
    genai.configure(api_key=settings.GEMINI_API_KEY)
    _model = genai.GenerativeModel("gemini-2.0-flash")
    logger.info("[Gemini] API key loaded. Model initialized.")

def is_ready() -> bool:
    return _model is not None

def test_prompt() -> tuple[bool, str]:
    """
    Sends a tiny test prompt at startup to confirm the key and network are OK.
    Returns (ok, message)
    """
    try:
        if _model is None:
            return (False, "Model not initialized.")
        res = _model.generate_content("Reply with the word: READY")
        txt = getattr(res, "text", None) or getattr(res.response, "text", lambda: "")()
        if "READY" in (txt or "").upper():
            return (True, "Gemini self-test OK.")
        return (False, f"Unexpected Gemini reply: {txt!r}")
    except Exception as e:
        return (False, f"Gemini error: {e}")

def generate(text: str) -> str:
    """
    Generate content (sync call). We call this from FastAPI with to_thread to avoid blocking.
    """
    if _model is None:
        raise RuntimeError("Gemini model not initialized.")
    res = _model.generate_content(text)
    # SDK sometimes exposes .text or .response.text(); handle both
    return getattr(res, "text", None) or getattr(res.response, "text", lambda: "")()



async def generate_gemini_response(user_message: str) -> str:
    """
    Calls Gemini API to generate a JSON structured investment response.
    Returns raw text (which should be JSON) for FastAPI to parse.
    """
    try:
        prompt = f"""
You are an AI investment advisor. 
Respond ONLY in valid JSON (no markdown, no explanations).
Format must strictly follow this schema:

{{
  "type": "investment",
  "title": "Short headline for the advice",
  "description": "Brief summary in 2-3 sentences.",
  "sections": [
    {{
      "heading": "Section Heading",
      "points": ["Bullet point 1", "Bullet point 2"]
    }}
  ],
  "advice": {{
    "summary": "Concise key takeaway",
    "recommendations": ["Tip 1", "Tip 2"]
  }},
  "disclaimer": "This is for informational purposes only and not financial advice."
}}

Now answer the user query: "{user_message}"
"""

        model = genai.GenerativeModel("gemini-1.5-flash")

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.5,
                max_output_tokens=500,
                response_mime_type="application/json"  # force JSON output
            )
        )

        if response and response.text:
            return response.text.strip()
        else:
            raise RuntimeError("Empty response from Gemini")

    except Exception as e:
        logging.exception(f"[Gemini] Failed to generate response: {e}")
        raise

