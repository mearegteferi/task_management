from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, func, Boolean
from datetime import datetime

class TimestampMixin:
    """Adds created_at and updated_at to any model."""
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

class SoftDeleteMixin:
    """Adds is_deleted flag for soft deletes."""
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, index=True)