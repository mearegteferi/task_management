from fastapi import APIRouter

from app.api.v1.users.endpoints import login, users, utils
from app.api.v1.users.endpoints import private

api_router = APIRouter()

api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(private.router)
