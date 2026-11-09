from app.api.routes.download import router as download_router
from app.api.routes.compliance import router as compliance_router
from app.api.routes.adapters import router as adapters_router
from app.api.routes.auth import router as auth_router

__all__ = [
    "download_router",
    "compliance_router",
    "adapters_router",
    "auth_router",
]

