import uuid
from typing import Optional

from pydantic import EmailStr

from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

class User(Base):
    __tablename__ = 'user_account'
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default_factory=uuid.uuid4)
    full_name: Mapped[Optional[str]]
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str]
    is_superuser: Mapped[Optional[bool]] = mapped_column(default=False)
    is_active: Mapped[Optional[bool]] = mapped_column(default=True)
