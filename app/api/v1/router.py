from fastapi import APIRouter
from app.api.v1.endpoints import tasks, tags

api_router = APIRouter()

api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(tags.router, prefix="/tags", tags=["Tags"])