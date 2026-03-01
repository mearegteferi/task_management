from fastapi import APIRouter

from app.api.v1.analytics import router as analytics_router
from app.api.v1.attachments import router as attachments_router
from app.api.v1.comments import router as comments_router
from app.api.v1.projects import router as projects_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

# Users
api_router.include_router(users_router.api_router)

# Projects (contains /projects and /tags)
api_router.include_router(projects_router.api_router)

# Tasks
api_router.include_router(tasks_router.router, tags=['Tasks'])

# Comments
api_router.include_router(comments_router.router, tags=['Comments'])

# Attachments
api_router.include_router(attachments_router.router, tags=['Attachments'])

# Analytics
api_router.include_router(
    analytics_router.router, prefix='/analytics', tags=['Analytics']
)
