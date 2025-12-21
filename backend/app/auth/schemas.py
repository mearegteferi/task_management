import uuid
from typing import Optional

from pydantic import BaseModel, Field, EmailStr

# these schemas are for the admin
class UserBase(BaseModel):
    email: EmailStr = Field(max_length=255)
    full_name: str | None = Field(default=None, max_length=255)
    is_active: bool = True
    is_superuser: bool = False

# when admin creates user
class UserCreate(UserBase):
    password: str

# when admin update users profile
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None)

# these schemas are for the public user
class UserRegister(BaseModel):
    email: EmailStr = Field(max_length=255)
    full_name: str | None = Field(default=None, max_length=255)
    password: str

# when user update their profile
class UserUpdateMe(BaseModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    full_name: str | None = Field(default=None)

# when returning user as API response
class UserPublic(UserBase):
    id: uuid.UUID

# for returning list of users
class UsersPublic(BaseModel):
    data: list[UserPublic]
    count: int

# for changing password
class UpdatePassword(BaseModel):
    current_password: str
    new_password: str

# when resetting password
class NewPassword(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


# additional schemas
class Message(BaseModel):
    message: str

# JSON payload containing access token
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Contents of JWT token
class TokenPayload(BaseModel):
    sub: str | None = None