from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.v1.users.dependencies import SessionDep
from app.api.v1.users.models import User
from app.api.v1.users.schemas import UserPublic
from app.core.security import get_password_hash

router = APIRouter(tags=['private'], prefix='/private')


class PrivateUserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    is_verified: bool = False


@router.post('/users/', response_model=UserPublic)
async def create_user(user_in: PrivateUserCreate, session: SessionDep) -> Any:
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
