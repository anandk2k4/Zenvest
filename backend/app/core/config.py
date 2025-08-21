import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGO_URI: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "zenvest")

    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
    
    COHERE_API_KEY : str | None = os.getenv("COHERE_API_KEY")
    
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY")
    
    CLERK_PUBLISHABLE_KEY: str = os.getenv("CLERK_PUBLISHABLE_KEY")
    CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY")
    
    CLERK_JWKS_URL: str | None = os.getenv("CLERK_JWKS_URL")
    CLERK_ISSUER: str | None = os.getenv("CLERK_ISSUER")
    
    FMP_API_KEY = os.getenv("FMP_API_KEY", "")
    YF_FALLBACK = os.getenv("YF_FALLBACK", "true").lower() == "true"
    
    JWT_SECRET = os.getenv("JWT_SECRET", "supersecret")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60
    
    DAILY_QUOTA_PER_USER: int = int(os.getenv("DAILY_QUOTA_PER_USER", "3"))
    CACHE_SIMILARITY_THRESHOLD: float = float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.85"))
    SUMMARY_AFTER_TURNS: int = int(os.getenv("SUMMARY_AFTER_TURNS", "8"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    DEFAULT_INFLATION_RATE: float = 0.06
    DEFAULT_EQUITY_RETURN: float = 0.12
    DEFAULT_DEBT_RETURN: float = 0.07
    

    ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

settings = Settings()
