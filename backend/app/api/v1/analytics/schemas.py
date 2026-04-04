from pydantic import BaseModel


class ProjectStatusCount(BaseModel):
    status: str
    count: int


class TaskStatusCount(BaseModel):
    status: str
    count: int


class TaskPriorityCount(BaseModel):
    priority: int
    count: int


class RecentTaskActivityPoint(BaseModel):
    date: str
    count: int


class AnalyticsResponse(BaseModel):
    total_projects: int
    projects_by_status: list[ProjectStatusCount]
    total_tasks: int
    completed_tasks: int
    task_completion_rate: float
    active_projects: int
    overdue_projects: int
    average_tasks_per_project: float
    tasks_by_status: list[TaskStatusCount]
    tasks_by_priority: list[TaskPriorityCount]
    recent_task_activity: list[RecentTaskActivityPoint]
