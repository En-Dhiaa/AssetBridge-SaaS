from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "AssetBridge SaaS"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = Field(default="change-this-ultra-secure-random-secret-key-in-production-min32chars", min_length=32)
    # Master key for AES-256-GCM encryption of partner credentials (32 bytes hex = 64 characters)
    ENCRYPTION_MASTER_KEY_HEX: str = Field(
        default="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        min_length=64,
        max_length=64
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database & Redis (Defaults to SQLite for local dev; PostgreSQL in Docker/Prod)
    DATABASE_URL: str = "sqlite+aiosqlite:///./assetbridge.db"
    SYNC_DATABASE_URL: str = "sqlite:///./assetbridge.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # S3 / MinIO Storage (Defaults to localhost for local dev; minio in Docker/Prod)
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_PUBLIC_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin123"
    S3_BUCKET_NAME: str = "assetbridge-downloads"
    S3_REGION: str = "us-east-1"

    # Parallel Download Configuration
    MAX_PARALLEL_CHUNKS: int = 16
    CHUNK_SIZE_BYTES: int = 4 * 1024 * 1024  # 4MB chunks
    DOWNLOAD_TIMEOUT_SECONDS: int = 300
    METADATA_CACHE_TTL_SECONDS: int = 600  # 10 minutes

    # SSRF Protection & Domain Allowance
    ALLOW_ALL_PUBLIC_DOMAINS: bool = True  # Allows any public internet domain while strictly blocking private/loopback/cloud metadata IPs
    ALLOWED_DOMAINS: List[str] = [
        "magnific.ai",
        "api.magnific.ai",
        "magnific.com",
        "www.magnific.com",
        "api.magnific.com",
        "motionarray.com",
        "api.motionarray.com",
        "elements.envato.com",
        "api.envato.com",
        "freepik.com",
        "api.freepik.com",
        "storyblocks.com",
        "api.storyblocks.com",
        "artgrid.io",
        "api.artgrid.io",
        "stock.adobe.com",
        "shutterstock.com",
        "unsplash.com",
        "pexels.com",
        "pixabay.com"
    ]

    # Partner Credentials (Configurable via environment or DB)
    MAGNIFIC_API_KEY: str = ""
    MAGNIFIC_API_URL: str = "https://api.magnific.ai/v1"

    MOTIONARRAY_CLIENT_ID: str = ""
    MOTIONARRAY_CLIENT_SECRET: str = ""
    MOTIONARRAY_API_URL: str = "https://api.motionarray.com/v1"

    ENVATO_API_TOKEN: str = ""
    ENVATO_API_URL: str = "https://api.envato.com/v1"

    FREEPIK_API_KEY: str = ""
    FREEPIK_API_URL: str = "https://api.freepik.com/v1"

    STORYBLOCKS_PUBLIC_KEY: str = ""
    STORYBLOCKS_PRIVATE_KEY: str = ""
    STORYBLOCKS_API_URL: str = "https://api.storyblocks.com/api/v2"

    ARTGRID_API_KEY: str = ""
    ARTGRID_API_URL: str = "https://api.artgrid.io/v1"

    # Rate Limiting
    RATE_LIMIT_USER_PER_MINUTE: int = 60
    RATE_LIMIT_PARTNER_BURST: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()

