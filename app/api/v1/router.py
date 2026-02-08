from fastapi import APIRouter
from app.api.v1.users import router as users_router
from app.api.v1.tasks import router as tasks_router

api_router = APIRouter()

api_router.include_router(users_router.api_router)
api_router.include_router(tasks_router.api_router)