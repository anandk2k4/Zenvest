import asyncio, logging, time
from typing import Optional
from fastapi import Header, HTTPException
from jose import jwt
import httpx
from cachetools import TTLCache

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------- Caches & Clients -------------------
_JWKS_TTL = 900           # 15 min JWKS refresh
_TOKEN_CACHE_TTL = 500    # 1 min token->user cache
_TOKEN_CACHE_MAX = 5000   # 5k cached tokens

_jwks_cache = {"keys": None, "ts": 0}
_token_cache: TTLCache[str, str] = TTLCache(maxsize=_TOKEN_CACHE_MAX, ttl=_TOKEN_CACHE_TTL)
_http: httpx.AsyncClient | None = None

async def _get_http() -> httpx.AsyncClient:
    global _http
    if _http is None:
        _http = httpx.AsyncClient(timeout=5, headers={"Connection": "keep-alive"})
    return _http

# ---------------------- JWKS -------------------------------
async def _refresh_jwks_once() -> None:
    http = await _get_http()
    resp = await http.get(settings.CLERK_JWKS_URL)
    resp.raise_for_status()
    data = resp.json()
    _jwks_cache["keys"] = data
    _jwks_cache["ts"] = time.time()
    logger.info("[Clerk] JWKS refreshed (%s keys).", len(data.get("keys", [])))

async def _refresh_jwks_periodically():
    while True:
        try:
            await _refresh_jwks_once()
        except Exception as e:
            logger.error("[Clerk] Failed to refresh JWKS: %s", e)
        await asyncio.sleep(_JWKS_TTL)

def _find_key(kid: str, jwks: dict):
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            return k
    return None

async def verify_token(token: str) -> Optional[str]:
    # Return cached user if available
    if user := _token_cache.get(token):
        return user

    try:
        header = jwt.get_unverified_header(token)
        jwks = _jwks_cache["keys"]
        if not jwks:
            await _refresh_jwks_once()
            jwks = _jwks_cache["keys"]

        key = _find_key(header.get("kid"), jwks or {})
        if not key:
            logger.error("[Clerk] No matching JWK for kid=%s.", header.get("kid"))
            return None

        payload = jwt.decode(
            token,
            key,
            algorithms=[header.get("alg", "RS256")],
            issuer=settings.CLERK_ISSUER,
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        if user_id:
            _token_cache[token] = user_id
        return user_id
    except Exception as e:
        logger.error("[Clerk] Token verification failed: %s", e)
        return None

# ---------------------- FastAPI Dependency -----------------
async def get_current_user_id(authorization: Optional[str] = Header(default=None, alias="Authorization")) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    
    token = authorization[7:].strip()
    user_id = await verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id

# ---------------------- App Startup Hook -------------------
def init_clerk(app):
    @app.on_event("startup")
    async def startup():
        await _get_http()  # warm HTTP client
        asyncio.create_task(_refresh_jwks_periodically())

    @app.on_event("shutdown")
    async def shutdown():
        global _http
        if _http:
            await _http.aclose()
            _http = None
