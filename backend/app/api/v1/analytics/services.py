import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.projects.models import Project, ProjectStatus
from app.api.v1.tasks.models import Task, TaskStatus


class AnalyticsService:
    @staticmethod
    async def get_analytics(db: AsyncSession, user_id: uuid.UUID) -> dict[str, Any]:
        now = datetime.now(UTC)
        recent_days = 7
        activity_start = (now - timedelta(days=recent_days - 1)).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        project_filter = (
            Project.owner_id == user_id,
            Project.is_deleted.is_(False),
        )
        task_filter = (
            Project.owner_id == user_id,
            Project.is_deleted.is_(False),
        )

        total_projects_result = await db.execute(
            select(func.count(Project.id)).where(*project_filter)
        )
        total_projects = int(total_projects_result.scalar_one() or 0)

        project_status_rows = await db.execute(
            select(Project.status, func.count(Project.id))
            .where(*project_filter)
            .group_by(Project.status)
        )
        project_status_map = {
            str(status): int(count) for status, count in project_status_rows.all()
        }
        projects_by_status = [
            {'status': status.value, 'count': project_status_map.get(status.value, 0)}
            for status in ProjectStatus
        ]

        active_projects_result = await db.execute(
            select(func.count(Project.id)).where(
                *project_filter,
                Project.status != ProjectStatus.DONE,
            )
        )
        active_projects = int(active_projects_result.scalar_one() or 0)

        overdue_projects_result = await db.execute(
            select(func.count(Project.id)).where(
                *project_filter,
                Project.due_date.is_not(None),
                Project.due_date < now,
                Project.status != ProjectStatus.DONE,
            )
        )
        overdue_projects = int(overdue_projects_result.scalar_one() or 0)

        total_tasks_result = await db.execute(
            select(func.count(Task.id)).join(Project).where(*task_filter)
        )
        total_tasks = int(total_tasks_result.scalar_one() or 0)

        completed_tasks_result = await db.execute(
            select(func.count(Task.id))
            .join(Project)
            .where(*task_filter, Task.is_completed.is_(True))
        )
        completed_tasks = int(completed_tasks_result.scalar_one() or 0)

        task_completion_rate = round(
            (completed_tasks / total_tasks * 100) if total_tasks else 0,
            1,
        )
        average_tasks_per_project = round(
            (total_tasks / total_projects) if total_projects else 0,
            1,
        )

        task_status_rows = await db.execute(
            select(Task.status, func.count(Task.id))
            .join(Project)
            .where(*task_filter)
            .group_by(Task.status)
        )
        task_status_map = {
            str(status): int(count) for status, count in task_status_rows.all()
        }
        tasks_by_status = [
            {'status': status.value, 'count': task_status_map.get(status.value, 0)}
            for status in TaskStatus
        ]

        task_priority_rows = await db.execute(
            select(Task.priority, func.count(Task.id))
            .join(Project)
            .where(*task_filter)
            .group_by(Task.priority)
        )
        task_priority_map = {
            int(priority): int(count) for priority, count in task_priority_rows.all()
        }
        tasks_by_priority = [
            {'priority': priority, 'count': task_priority_map.get(priority, 0)}
            for priority in (1, 2, 3)
        ]

        activity_rows = await db.execute(
            select(func.date(Task.created_at), func.count(Task.id))
            .join(Project)
            .where(*task_filter, Task.created_at >= activity_start)
            .group_by(func.date(Task.created_at))
            .order_by(func.date(Task.created_at))
        )
        activity_map = {
            activity_date.isoformat(): int(count)
            for activity_date, count in activity_rows.all()
        }
        recent_task_activity = []
        for day_offset in range(recent_days):
            day = activity_start + timedelta(days=day_offset)
            day_key = day.date().isoformat()
            recent_task_activity.append(
                {'date': day_key, 'count': activity_map.get(day_key, 0)}
            )

        return {
            'total_projects': total_projects,
            'projects_by_status': projects_by_status,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'task_completion_rate': task_completion_rate,
            'active_projects': active_projects,
            'overdue_projects': overdue_projects,
            'average_tasks_per_project': average_tasks_per_project,
            'tasks_by_status': tasks_by_status,
            'tasks_by_priority': tasks_by_priority,
            'recent_task_activity': recent_task_activity,
        }
