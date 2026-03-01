import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin

if TYPE_CHECKING:
    from app.api.v1.tasks.models import Task
    from app.api.v1.users.models import User


# Enum for strict status control
class ProjectStatus(enum.StrEnum):
    TODO = 'todo'
    IN_PROGRESS = 'in_progress'
    DONE = 'done'


class Project(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = 'projects'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), default=ProjectStatus.TODO
    )
    priority: Mapped[int] = mapped_column(default=1)
    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), nullable=False)
    owner: Mapped[User] = relationship('User', back_populates='projects')

    tasks: Mapped[list[Task]] = relationship(
        'Task',
        back_populates='project',
        lazy='selectin',
        cascade='all, delete-orphan',
    )
