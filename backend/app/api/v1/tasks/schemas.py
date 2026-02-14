import uuid
from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from app.api.v1.tasks.models import TaskStatus

class TaskBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: int = Field(1, ge=1, le=3)
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    # User can optionally create tags while creating a task
    tags: List[TagCreate] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=3)
    due_date: Optional[datetime] = None
    tags: Optional[List[TagCreate]] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    owner_id: uuid.UUID
    tags: List[TagResponse] = []

    model_config = ConfigDict(from_attributes=True)


class TagBase(BaseModel):
    name: str
    color: str = "#FFFFFF"

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
    id: int
    model_config = ConfigDict(from_attributes=True)