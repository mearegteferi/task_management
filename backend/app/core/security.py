from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

from app.core.config import settings

password_hash = PasswordHash(
    (
        Argon2Hasher(),
        BcryptHasher(),
    )
)


def create_token(subject: str | Any, expires_delta: timedelta, token_type: Literal["access", "refresh"]) -> str:
    expire = datetime.now(timezone.utc) + expires_delta

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": token_type,  # CRITICAL: Distinguish between access and refresh
        "iat": datetime.now(timezone.utc)
    }

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_access_token(subject: str | Any) -> str:
    return create_token(
        subject=subject,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        token_type="access"
    )


def create_refresh_token(subject: str | Any) -> str:
    return create_token(
        subject=subject,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
        token_type="refresh"
    )


def verify_password(
    plain_password: str, hashed_password: str
) -> tuple[bool, str | None]:
    return password_hash.verify_and_update(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)
