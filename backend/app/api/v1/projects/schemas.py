import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.api.v1.projects.models import ProjectStatus


class ProjectBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str | None = None
    status: ProjectStatus = ProjectStatus.TODO
    priority: int = Field(1, ge=1, le=3)
    due_date: datetime | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=200)
    description: str | None = None
    status: ProjectStatus | None = None
    priority: int | None = Field(None, ge=1, le=3)
    due_date: datetime | None = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime | None
    owner_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
