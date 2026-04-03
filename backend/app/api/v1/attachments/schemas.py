from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AttachmentBase(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    file_type: str | None = Field(default=None, max_length=255)


class AttachmentResponse(AttachmentBase):
    id: int
    task_id: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
