from pydantic import BaseModel


class ProjectStatusCount(BaseModel):
    status: str
    count: int


class AnalyticsResponse(BaseModel):
    total_projects: int
    projects_by_status: list[ProjectStatusCount]
    total_tasks: int
