# app/schemas/task.py
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# Shared properties
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_completed: bool = False

# Properties to receive via API on creation
class TaskCreate(TaskBase):
    pass

# Properties to return via API
class TaskResponse(TaskBase):
    id: int
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)