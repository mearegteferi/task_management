from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import SessionDep, get_current_user_refresh
from app.api.v1.users import services
from app.api.v1.users.schemas import Message, NewPassword, Token, TokenRefresh
from app.api.v1.users.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)
from app.core import security

router = APIRouter(tags=['login'])


@router.post('/login/access-token', response_model=Token)
async def login_access_token(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = await services.authenticate(
        session=session,
        email=form_data.username,
        password=form_data.password,
    )
    if not user:
        raise HTTPException(status_code=400, detail='Incorrect email or password')
    if not user.is_active:
        raise HTTPException(status_code=400, detail='Inactive user')

    return Token(
        access_token=security.create_access_token(user.id),
        refresh_token=security.create_refresh_token(user.id),
    )


@router.post('/refresh-token', response_model=Token)
async def refresh_token(session: SessionDep, body: TokenRefresh) -> Token:
    user = await get_current_user_refresh(token=body.refresh_token, session=session)
    return Token(
        access_token=security.create_access_token(user.id),
        refresh_token=security.create_refresh_token(user.id),
    )


@router.post('/password-recovery/{email}')
async def recover_password(email: str, session: SessionDep) -> Message:
    user = await services.get_user_by_email(session=session, email=email)

    if user:
        password_reset_token = generate_password_reset_token(email=email)
        email_data = generate_reset_password_email(
            email_to=user.email,
            email=email,
            token=password_reset_token,
        )
        send_email(
            email_to=user.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )

    return Message(
        message='If that email is registered, we sent a password recovery link'
    )


@router.post('/reset-password/')
async def reset_password(session: SessionDep, body: NewPassword) -> Message:
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail='Invalid token')

    user = await services.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(status_code=400, detail='Invalid token')
    if not user.is_active:
        raise HTTPException(status_code=400, detail='Inactive user')

    await services.update_user(
        session=session,
        db_user=user,
        user_in={'password': body.new_password},
    )
    return Message(message='Password updated successfully')
