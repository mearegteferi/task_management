from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field

from app.api.deps import SessionDep
from app.api.v1.users.models import User
from app.api.v1.users.schemas import UserPublic
from app.core.security import get_password_hash

router = APIRouter(tags=['private'], prefix='/private')


class PrivateUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


@router.post('/users/', response_model=UserPublic)
async def create_user(user_in: PrivateUserCreate, session: SessionDep) -> Any:
    user = User(
        email=str(user_in.email),
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
