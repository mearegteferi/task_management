from datetime import datetime

from pydantic import BaseModel, Field

from app.api.v1.projects.models import ProjectStatus
from app.api.v1.projects.schemas import ProjectResponse
from app.api.v1.tasks.schemas import TaskResponse


class TaskSuggestion(BaseModel):
    # A single task suggested by the architect.
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    estimated_priority: int = Field(1, ge=1, le=3)


class ProjectBreakdown(BaseModel):
    # The full project draft returned by the architect.
    title: str = Field(..., min_length=3, max_length=200)
    description: str | None = None
    tasks: list[TaskSuggestion] = Field(default_factory=list)


class SuggestProjectRequest(BaseModel):
    # The user's first request for creating a draft project.
    title: str = Field(..., min_length=3, max_length=200)
    description: str | None = None
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    additional_context: str | None = None


class ArchitectChatRequest(BaseModel):
    # Feedback sent to refine an existing draft.
    session_id: str = Field(..., min_length=1)
    feedback: str = Field(..., min_length=1)


class ArchitectConfirmRequest(BaseModel):
    # Final options used when saving the approved draft.
    session_id: str = Field(..., min_length=1)
    status: ProjectStatus = ProjectStatus.TODO
    priority: int | None = Field(None, ge=1, le=3)
    due_date: datetime | None = None


class ArchitectDraftResponse(BaseModel):
    # The draft response returned after suggest or chat.
    session_id: str
    draft: ProjectBreakdown


class ArchitectConfirmResponse(BaseModel):
    # The saved project and tasks returned after confirmation.
    project: ProjectResponse
    tasks: list[TaskResponse] = Field(default_factory=list)
