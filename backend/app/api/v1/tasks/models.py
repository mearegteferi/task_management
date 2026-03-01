from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Table,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.api.v1.attachments.models import Attachment
    from app.api.v1.comments.models import Comment
    from app.api.v1.projects.models import Project


# Tag model moved from projects to tasks
class Tag(Base, TimestampMixin):
    __tablename__ = 'tags'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    color: Mapped[str] = mapped_column(String(7), default='#FFFFFF')  # Hex code

    # Back reference to tasks
    tasks: Mapped[list[Task]] = relationship(
        'Task', secondary='task_tags', back_populates='tags'
    )


# Association Table for Task-Tags Many-to-Many
task_tags = Table(
    'task_tags',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True),
)


class Task(Base, TimestampMixin):
    __tablename__ = 'tasks'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    project_id: Mapped[int] = mapped_column(ForeignKey('projects.id'), nullable=False)

    project: Mapped[Project] = relationship('Project', back_populates='tasks')

    tags: Mapped[list[Tag]] = relationship(
        'Tag', secondary=task_tags, back_populates='tasks', lazy='selectin'
    )

    comments: Mapped[list[Comment]] = relationship(
        'Comment',
        back_populates='task',
        lazy='selectin',
        cascade='all, delete-orphan',
    )

    attachments: Mapped[list[Attachment]] = relationship(
        'Attachment',
        back_populates='task',
        lazy='selectin',
        cascade='all, delete-orphan',
    )
