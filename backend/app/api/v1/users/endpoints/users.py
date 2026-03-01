import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select

from app.api.v1.users import services
from app.api.v1.users.dependencies import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.api.v1.users.models import User
from app.api.v1.users.schemas import (
    Message,
    UpdatePassword,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.api.v1.users.utils import generate_new_account_email, send_email
from app.core.config import settings
from app.core.security import verify_password

router = APIRouter(prefix='/users', tags=['users'])


@router.get(
    '/',
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
async def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    # Async Count
    count_statement = select(func.count()).select_from(User)
    count_result = await session.execute(count_statement)
    count = count_result.scalar()

    # Async Select
    statement = select(User).offset(skip).limit(limit)
    result = await session.execute(statement)
    users = result.scalars().all()

    return UsersPublic(data=list(users), count=int(count or 0))  # type: ignore


@router.post(
    '/', dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic
)
async def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    user = await services.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail='The user with this email already exists in the system.',
        )

    user = await services.create_user(session=session, user_create=user_in)
    if settings.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.patch('/me', response_model=UserPublic)
async def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    if user_in.email:
        existing_user = await services.get_user_by_email(
            session=session, email=user_in.email
        )
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail='User with this email already exists'
            )

    user_data = user_in.model_dump(exclude_unset=True)
    # Using generic update crud
    current_user = await services.update_user(
        session=session, db_user=current_user, user_in=user_data
    )
    return current_user


@router.patch('/me/password', response_model=Message)
async def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    verified, _ = verify_password(body.current_password, current_user.hashed_password)
    if not verified:
        raise HTTPException(status_code=400, detail='Incorrect password')
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail='New password cannot be the same as the current one'
        )

    await services.update_user(
        session=session, db_user=current_user, user_in={'password': body.new_password}
    )
    return Message(message='Password updated successfully')


@router.get('/me', response_model=UserPublic)
async def read_user_me(current_user: CurrentUser) -> Any:
    return current_user


@router.delete('/me', response_model=Message)
async def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail='Super users are not allowed to delete themselves'
        )
    # Async Delete
    await session.delete(current_user)
    await session.commit()
    return Message(message='User deleted successfully')


@router.post('/signup', response_model=UserPublic)
async def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    user = await services.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail='The user with this email already exists in the system',
        )
    # Convert Register schema to Create schema
    user_create = UserCreate.model_validate(user_in.model_dump())
    user = await services.create_user(session=session, user_create=user_create)
    return user


@router.get('/{user_id}', response_model=UserPublic)
async def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    user = await session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    if user is None:
        raise HTTPException(status_code=404, detail='User not found')
    return user


@router.patch(
    '/{user_id}',
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
async def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    db_user = await session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail='The user with this id does not exist in the system',
        )
    if user_in.email:
        existing_user = await services.get_user_by_email(
            session=session, email=user_in.email
        )
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail='User with this email already exists'
            )

    db_user = await services.update_user(
        session=session, db_user=db_user, user_in=user_in
    )
    return db_user


@router.delete('/{user_id}', dependencies=[Depends(get_current_active_superuser)])
async def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    if user.id == current_user.id:
        raise HTTPException(
            status_code=403, detail='Super users are not allowed to delete themselves'
        )

    # Removed Item Cascade logic (handled by DB or not needed as Items are removed)
    await session.delete(user)
    await session.commit()
    return Message(message='User deleted successfully')
