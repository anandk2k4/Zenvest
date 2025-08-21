import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from .core.config import settings
from pymongo import ASCENDING, DESCENDING

logger = logging.getLogger(__name__)

_mongo_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    """Initialize MongoDB connection"""
    global _mongo_client, _db
    if _mongo_client is not None:
        return

    logger.info("[MongoDB] Connecting to %s ...", settings.MONGO_URI)
    _mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
    _db = _mongo_client[settings.DB_NAME]

    # Simple health check
    await _db.command("ping")
    logger.info("[MongoDB] Connected. DB=%s", settings.DB_NAME)
    
    await _db.goals.create_index("clerk_user_id")
    await _db.users.create_index("clerk_user_id", unique=True)
    await _db.ai_insights.create_index("clerk_user_id")


async def close_mongo_connection() -> None:
    """Close the MongoDB connection on shutdown"""
    global _mongo_client
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        logger.info("[MongoDB] Connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Return active DB connection"""
    assert _db is not None, "MongoDB is not connected yet. Call connect_to_mongo() at startup."
    return _db


def get_collection(name: str) -> AsyncIOMotorCollection:
    """Helper to quickly get a collection"""
    return get_database().get_collection(name)


# Shorthand access to main collections
def income_collection() -> AsyncIOMotorCollection:
    return get_collection("income")

def expenses_collection() -> AsyncIOMotorCollection:
    return get_collection("expenses")

def reports_collection() -> AsyncIOMotorCollection:
    return get_collection("reports")

def goals_collection() -> AsyncIOMotorCollection:
    return get_collection("goals")


async def init_indexes():
    # Budgets
    await _db.budgets.create_index([("clerk_user_id", ASCENDING)])
    await _db.budgets.create_index([("created_at", DESCENDING)])

    # Income
    await _db.income.create_index([("clerk_user_id", ASCENDING)])
    await _db.income.create_index([("budget_id", ASCENDING)])
    await _db.income.create_index([("date", DESCENDING)])

    # Expenses
    await _db.expenses.create_index([("clerk_user_id", ASCENDING)])
    await _db.expenses.create_index([("budget_id", ASCENDING)])
    await _db.expenses.create_index([("date", DESCENDING)])
    await _db.expenses.create_index([("category", ASCENDING)])

    # Dashboard summaries (history of summaries per user)
    await _db.dashboard_summaries.create_index([("user.clerk_user_id", ASCENDING)])
    await _db.dashboard_summaries.create_index([("clerk_user_id", ASCENDING), ("created_at", DESCENDING)])

    # AI advice (history per user)
    await _db.ai_advice.create_index([("clerk_user_id", ASCENDING)])
    await _db.ai_advice.create_index([("generated_at", DESCENDING)])

    