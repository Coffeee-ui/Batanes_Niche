from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.saved_jobs import router as saved_jobs_router
from app.api.v1.applications import router as applications_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.meta import router as meta_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(jobs_router)
api_router.include_router(saved_jobs_router)
api_router.include_router(applications_router)
api_router.include_router(recommendations_router)
api_router.include_router(notifications_router)
api_router.include_router(meta_router)

__all__ = ["api_router"]
