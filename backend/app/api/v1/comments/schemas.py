import uuid
from datetime import datetime

from pydantic import BaseModel


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    pass


class CommentResponse(CommentBase):
    id: int
    task_id: int
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
