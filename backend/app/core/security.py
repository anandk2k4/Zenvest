from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import httpx, os

security = HTTPBearer()

async def verify_clerk_token(credentials=Depends(security)):
    token = credentials.credentials
    clerk_secret = os.getenv("CLERK_SECRET_KEY")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.clerk.dev/v1/me",
                headers={"Authorization": f"Bearer {token}", "Authorization": f"Bearer {clerk_secret}"}
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Clerk token")
            return response.json()
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")
