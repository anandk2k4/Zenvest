import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from .core.config import settings

logger = logging.getLogger(__name__)

_mongo_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None

async def connect_to_mongo() -> None:
    global _mongo_client, _db
    if _mongo_client is not None:
        return
    logger.info("[MongoDB] Connecting to %s ...", settings.MONGO_URI)
    _mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
    _db = _mongo_client[settings.DB_NAME]
    # simple ping
    await _db.command("ping")
    logger.info("[MongoDB] Connected. DB=%s", settings.DB_NAME)

async def close_mongo_connection() -> None:
    global _mongo_client
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        logger.info("[MongoDB] Connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    assert _db is not None, "MongoDB is not connected yet. Call connect_to_mongo() at startup."
    return _db

def get_collection(name: str) -> AsyncIOMotorCollection:
    return get_database().get_collection(name)
