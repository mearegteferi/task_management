from datetime import datetime

from pydantic import BaseModel


class AttachmentBase(BaseModel):
    filename: str
    file_type: str | None = None


class AttachmentCreate(AttachmentBase):
    file_path: str


class AttachmentResponse(AttachmentBase):
    id: int
    task_id: int
    uploaded_at: datetime
    # We might want to return a URL too

    class Config:
        from_attributes = True
