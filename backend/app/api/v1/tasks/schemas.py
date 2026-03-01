from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TagBase(BaseModel):
    name: str
    color: str = '#FFFFFF'


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class TaskBase(BaseModel):
    title: str
    is_completed: bool = False


class TaskCreate(TaskBase):
    tags: list[TagCreate] = []


class TaskUpdate(BaseModel):
    title: str | None = None
    is_completed: bool | None = None
    tags: list[TagCreate] | None = None


class TaskResponse(TaskBase):
    id: int
    title: str
    project_id: int
    created_at: datetime
    tags: list[TagResponse] = []

    model_config = ConfigDict(from_attributes=True)
