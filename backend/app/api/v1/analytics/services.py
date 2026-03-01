from typing import Any
import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.projects.models import Project
from app.api.v1.tasks.models import Task

class AnalyticsService:
    @staticmethod
    async def get_analytics(db: AsyncSession, user_id: uuid.UUID) -> dict[str, Any]:
        # Total Projects
        total_projects_query = select(func.count(Project.id)).where(
            Project.owner_id == user_id, 
            Project.is_deleted == False
        )
        total_projects_result = await db.execute(total_projects_query)
        total_projects = total_projects_result.scalar_one()

        # Projects by status
        status_query = select(
            Project.status, 
            func.count(Project.id)
        ).where(
            Project.owner_id == user_id, 
            Project.is_deleted == False
        ).group_by(Project.status)
        
        status_result = await db.execute(status_query)
        projects_by_status = [
            {"status": status, "count": count} 
            for status, count in status_result.all()
        ]

        # Total Tasks (across all owned projects)
        total_tasks_query = select(func.count(Task.id)).join(Project).where(
            Project.owner_id == user_id,
            Project.is_deleted == False
        )
        total_tasks_result = await db.execute(total_tasks_query)
        total_tasks = total_tasks_result.scalar_one()

        return {
            "total_projects": total_projects,
            "projects_by_status": projects_by_status,
            "total_tasks": total_tasks
        }
