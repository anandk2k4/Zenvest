from fastapi import APIRouter
from datetime import datetime
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cohere_configured": bool(settings.COHERE_API_KEY),
    }
