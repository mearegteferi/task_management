import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --- Shared Properties ---
class UserBase(BaseModel):
    email: EmailStr = Field(max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# --- Creation (POST /users) ---
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# --- Updates (PATCH /users) ---
class UserUpdate(BaseModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    is_superuser: bool | None = None


class UserUpdateMe(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# --- Responses (GET /users) ---
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None

    # Config to allow Pydantic to read from SQLAlchemy models
    model_config = ConfigDict(from_attributes=True)


class UsersPublic(BaseModel):
    data: list[UserPublic]
    count: int


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class TokenPayload(BaseModel):
    sub: str | None = None


class NewPassword(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class Message(BaseModel):
    message: str