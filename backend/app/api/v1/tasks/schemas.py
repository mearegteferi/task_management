from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.api.v1.tasks.models import TaskStatus


class TagBase(BaseModel):
    name: str
    color: str = '#FFFFFF'


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus = TaskStatus.TODO
    priority: int = Field(1, ge=1, le=3)
    is_completed: bool = False


class TaskCreate(TaskBase):
    tags: list[TagCreate] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: int | None = Field(None, ge=1, le=3)
    is_completed: bool | None = None
    tags: list[TagCreate] | None = None


class TaskResponse(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    tags: list[TagResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
