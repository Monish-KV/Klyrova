import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI, Depends, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.database.database import engine, Base, get_db, SessionLocal
from backend.app.database.seed import seed_database
from backend.app.risk.ml_risk_pipeline import ml_pipeline

# Configure standard server logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [GuardianPay AI] %(message)s"
)
logger = logging.getLogger("guardianpay")

# Import API routes
from backend.app.api.routes.customers import router as customers_router
from backend.app.api.routes.profile import router as profile_router
from backend.app.api.routes.beneficiaries import router as beneficiaries_router
from backend.app.api.routes.transactions import router as transactions_router
from backend.app.api.routes.scams import router as scams_router
from backend.app.api.routes.alerts import router as alerts_router
from backend.app.api.routes.safety import router as safety_router
from backend.app.api.routes.dashboard import router as dashboard_router
from backend.app.api.routes.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed demo data
    logger.info("Initializing SQLite database tables and foreign key constraints...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("Database initialized and demo personas verified.")
    finally:
        db.close()
    yield
    # Shutdown
    logger.info("Shutting down GuardianPay AI backend service.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Proactive Digital Banking Safety Layer for Vulnerable Customers. Built by Team Klyrova for VIT Hackathon.",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits frontend on localhost, Vercel, or AI Studio preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    method = request.method
    path = request.url.path
    if path.startswith("/api/"):
        logger.info(f"Incoming API Request: {method} {path}")
    response = await call_next(request)
    if path.startswith("/api/"):
        logger.info(f"API Response: {method} {path} -> Status {response.status_code}")
    return response

# Base health check with DB & AI observability
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    has_gemini = bool(settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY"))
    ai_status = "active (Gemini 3.6 Flash)" if has_gemini else "fallback_active (Local Heuristic Engine)"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": f"SQLite ({db_status})",
        "aiConfiguration": ai_status,
        "environment": settings.ENVIRONMENT,
        "architecture": "React -> FastAPI -> Risk Engine / Gemini -> SQLite",
    }

@app.get("/api/health")
def api_health_check(db: Session = Depends(get_db)):
    return health_check(db=db)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "team": "Klyrova",
        "event": "VIT Hackathon",
    }

# ML Diagnostic endpoint for judges and hackathon demonstration
@app.post("/api/ml/anomaly-diagnostic")
def ml_anomaly_diagnostic(
    telemetry: Dict[str, Any] = Body(...),
    customer: Dict[str, Any] = Body(default_factory=dict),
):
    """
    Direct ML risk scoring endpoint powered by Scikit-Learn & Pandas.
    """
    return ml_pipeline.predict_anomaly(telemetry, customer)

# Include API Routers under /api
app.include_router(customers_router, prefix="/api", tags=["Customers"])
app.include_router(profile_router, prefix="/api", tags=["Profile"])
app.include_router(beneficiaries_router, prefix="/api", tags=["Beneficiaries"])
app.include_router(transactions_router, prefix="/api", tags=["Transactions"])
app.include_router(scams_router, prefix="/api", tags=["Scam Analysis"])
app.include_router(alerts_router, prefix="/api", tags=["Alerts"])
app.include_router(safety_router, prefix="/api", tags=["Safety Settings"])
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
