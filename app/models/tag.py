from app.db.base import Base
from app.models.mixins import TimestampMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from typing import List

class Tag(Base, TimestampMixin):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    color: Mapped[str] = mapped_column(String(7), default="#FFFFFF") # Hex code

    # Back reference to tasks
    tasks: Mapped[List["Task"]] = relationship("Task", secondary="task_tags", back_populates="tags")