from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.api.v1.tasks.models import Task


class Attachment(Base):
    __tablename__ = 'attachments'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    file_type: Mapped[str] = mapped_column(
        String, nullable=True
    )  # e.g. 'image/png', 'application/pdf'
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    task_id: Mapped[int] = mapped_column(ForeignKey('tasks.id'), nullable=False)

    task: Mapped[Task] = relationship('Task', back_populates='attachments')
