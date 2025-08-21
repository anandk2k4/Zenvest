import time
import requests
import logging
from typing import Optional
from fastapi import Header, HTTPException
from jose import jwt

from app.core.config import settings

logger = logging.getLogger(__name__)

# --- Clerk JWKS Cache ---
_jwks_cache = {"keys": None, "ts": 0}


def _get_jwks():
    now = time.time()
    if _jwks_cache["keys"] and now - _jwks_cache["ts"] < 900:  # 15 min cache
        return _jwks_cache["keys"]

    if not settings.CLERK_JWKS_URL:
        raise RuntimeError("CLERK_JWKS_URL is not set.")

    resp = requests.get(settings.CLERK_JWKS_URL, timeout=5)
    resp.raise_for_status()
    data = resp.json()
    _jwks_cache["keys"] = data
    _jwks_cache["ts"] = now
    return data


def _find_key(kid: str, jwks: dict):
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            return k
    return None


def _clerk_verify_and_get_user(token: str) -> Optional[str]:
    try:
        header = jwt.get_unverified_header(token)
        jwks = _get_jwks()
        key = _find_key(header.get("kid"), jwks)
        if key is None:
            logger.error("[Clerk] No matching JWK for kid.")
            return None

        # python-jose can use the JWK dict directly
        payload = jwt.decode(
            token,
            key,
            algorithms=[header.get("alg", "RS256")],
            issuer=settings.CLERK_ISSUER,
            options={"verify_aud": False},  # disable audience check unless you need it
        )
        return payload.get("sub")
    except Exception as e:
        logger.error("[Clerk] Token verification failed: %s", e)
        return None


# ✅ Dependency for FastAPI
async def get_current_user_id(
    authorization: Optional[str] = Header(default=None, alias="Authorization")
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Unauthorized: Missing Bearer token"
        )

    token = authorization.replace("Bearer ", "").strip()
    user_id = _clerk_verify_and_get_user(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")

    return user_id
