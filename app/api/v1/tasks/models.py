import enum
from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, Enum, Table, Column, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.mixins import TimestampMixin, SoftDeleteMixin


class TimestampMixin:
    """Adds created_at and updated_at to any model."""
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

class SoftDeleteMixin:
    """Adds is_deleted flag for soft deletes."""
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    
# Enum for strict status control
class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class Tag(Base, TimestampMixin):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    color: Mapped[str] = mapped_column(String(7), default="#FFFFFF") # Hex code

    # Back reference to tasks
    tasks: Mapped[List["Task"]] = relationship("Task", secondary="task_tags", back_populates="tags")



# Association Table for Many-to-Many
task_tags = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Task(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority: Mapped[int] = mapped_column(default=1)  # 1=Low, 3=High
    due_date: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Relationship
    tags: Mapped[List["app.models.tag.Tag"]] = relationship(
        "app.models.tag.Tag",
        secondary=task_tags,
        back_populates="tasks",
        lazy="selectin"  # Optimization for async
    )