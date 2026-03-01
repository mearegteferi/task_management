from collections.abc import AsyncGenerator
from typing import Annotated, Literal

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users.models import User
from app.api.v1.users.schemas import TokenPayload
from app.core.config import settings
from app.db.session import AsyncSessionLocal

# OAuth2 scheme for Swagger UI
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f'{settings.API_V1_STR}/login/access-token'
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


async def _get_user_from_token(
    token: str, session: AsyncSession, required_type: Literal['access', 'refresh']
) -> User:
    """
    Internal helper to decode token, validate type, and fetch user.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)

        if payload.get('type') != required_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f'Invalid token type. Expected {required_type} token.',
            )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token has expired',
            headers={'WWW-Authenticate': 'Bearer'},
        )
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Could not validate credentials',
        )

    user = await session.get(User, token_data.sub)

    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    if not user.is_active:
        raise HTTPException(status_code=400, detail='Inactive user')

    return user


async def get_current_user(session: SessionDep, token: TokenDep) -> User:
    return await _get_user_from_token(token, session, required_type='access')


async def get_current_user_refresh(token: str, session: SessionDep) -> User:
    return await _get_user_from_token(token, session, required_type='refresh')


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user
