from fastapi import APIRouter

from app.api.v1.users.endpoints import login, private, users, utils

api_router = APIRouter()

api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(private.router)
