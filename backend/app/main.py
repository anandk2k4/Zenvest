from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routes import budgets, budget_dashboard, goals, news, chatBot, expenses, income, health, ai
from .db import connect_to_mongo, close_mongo_connection, get_database, init_indexes
from .services import gemini_service as gemini
import logging

app = FastAPI()

# --- Logging setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger("zenvest-backend")
 

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers

# app.include_router(dashboard.router)
app.include_router(news.router, prefix="/api", tags=["news"])

app.include_router(goals.router, prefix="/api/goals", tags=["goals"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])

app.include_router(chatBot.router, prefix="/api/chatBot", tags=["ChatBot"])

app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(expenses.router, prefix="/api/expense", tags=["Expenses"])
app.include_router(income.router, prefix="/api/income", tags=["Income"])
app.include_router(budget_dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
# app.include_router(advisor.router,prefix="/api/budget")

app.include_router(health.router)



@app.on_event("startup")
async def on_startup():
    logger.info("[Startup] Booting ZenVest AI Advisor API")
    # Mongo
    await connect_to_mongo()
    await init_indexes()
    # Gemini
    gemini.init_gemini()
    ok, msg = gemini.test_prompt()
    if ok:
        logger.info("[Startup] %s", msg)
    else:
        logger.error("[Startup] %s", msg)
    app.mongodb = get_database()
    

@app.on_event("shutdown")
async def on_shutdown():
    await close_mongo_connection()
    logger.info("[Shutdown] Bye.")

@app.get("/")
async def root():
    return {"message": "ZenVest Budget Planner API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ZenVest Budget API"}