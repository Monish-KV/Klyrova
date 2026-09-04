import os
from pathlib import Path

# Root project directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DB_FILE_PATH = BASE_DIR / "guardianpay.sqlite"

class Settings:
    PROJECT_NAME: str = "GuardianPay AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))
    
    # SQLite Database URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{DB_FILE_PATH}"
    )
    
    # Gemini AI Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # CORS Origins (Vercel, Localhost, AI Studio preview)
    CORS_ORIGINS_RAW: str = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    )

    @property
    def cors_origins(self) -> list[str]:
        origins = [orig.strip() for orig in self.CORS_ORIGINS_RAW.split(",") if orig.strip()]
        if "*" not in origins and self.ENVIRONMENT == "development":
            # In development, also permit common preview domains or localhost variants
            origins.extend(["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"])
        return list(set(origins))

settings = Settings()
