from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.database import engine, Base
from app.api.routes import download_router, compliance_router, adapters_router, auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically initialize PostgreSQL tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Commercial Asset Downloader SaaS & Multi-Platform Partner Integration Gateway",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length", "Accept-Ranges", "X-Asset-ID", "X-Partner-ID"]
)

# Register API Routers
app.include_router(download_router, prefix=settings.API_V1_STR)
app.include_router(compliance_router, prefix=settings.API_V1_STR)
app.include_router(adapters_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "2.0.0",
        "ssrf_protection": "ACTIVE",
        "audit_chain": "ENABLED"
    }


@app.get("/")
async def root():
    return {
        "platform": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "compliance": f"{settings.API_V1_STR}/compliance/agreements"
    }
