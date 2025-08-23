import os
import cohere
import logging
import asyncio

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
if not COHERE_API_KEY:
    raise ValueError("Missing COHERE_API_KEY in environment variables")

co = cohere.AsyncClient(COHERE_API_KEY)

async def generate_cohere_response(user_message: str) -> str:
    """
    Calls Cohere API to generate a JSON structured investment response.
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
        resp = await co.generate(
            model="command-r-plus",  # Cohere's reasoning model
            prompt=prompt,
            max_tokens=500,
            temperature=0.5,
        )

        if resp.generations and resp.generations[0].text:
            return resp.generations[0].text.strip()
        else:
            raise RuntimeError("Empty response from Cohere")

    except Exception as e:
        logging.exception(f"[Cohere] Failed to generate response: {e}")
        raise