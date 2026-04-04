import uuid
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.projects.models import Project
from app.api.v1.tasks import schemas
from app.api.v1.tasks.models import Task, TaskStatus
from app.api.v1.tasks.services.tag_service import TagService
from app.core.redis import clear_cache_pattern, get_cache, set_cache


class TaskService:
    @staticmethod
    def _normalize_task_state(
        *,
        status: TaskStatus | None,
        is_completed: bool | None,
        current_status: TaskStatus = TaskStatus.TODO,
        current_is_completed: bool = False,
    ) -> tuple[TaskStatus, bool]:
        resolved_status = status if status is not None else current_status
        resolved_is_completed = (
            current_is_completed if is_completed is None else is_completed
        )

        if resolved_is_completed or resolved_status == TaskStatus.DONE:
            return TaskStatus.DONE, True

        if (
            status is None
            and is_completed is False
            and current_status == TaskStatus.DONE
        ):
            resolved_status = TaskStatus.TODO

        return resolved_status, False

    @staticmethod
    async def create_task(
        db: AsyncSession,
        project_id: int,
        task_in: schemas.TaskCreate,
        user_id: uuid.UUID,
    ) -> Task:
        # Verify project exists and belongs to user
        result = await db.execute(
            select(Project).where(Project.id == project_id, Project.owner_id == user_id)
        )
        project = result.scalars().first()
        if not project:
            raise HTTPException(status_code=404, detail='Project not found')

        # Resolve Tags
        tag_objects = await TagService.get_or_create_tags(db, task_in.tags)
        status, is_completed = TaskService._normalize_task_state(
            status=task_in.status,
            is_completed=task_in.is_completed,
        )

        task = Task(
            title=task_in.title,
            description=task_in.description,
            status=status,
            priority=task_in.priority,
            is_completed=is_completed,
            project_id=project_id,
            tags=tag_objects,
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)

        # Invalidate cache
        await clear_cache_pattern(f'project:{project_id}:tasks:*')
        await clear_cache_pattern(f'user:{user_id}:analytics')

        return task

    @staticmethod
    async def get_tasks(
        db: AsyncSession, project_id: int, user_id: uuid.UUID
    ) -> list[Task] | list[schemas.TaskResponse]:
        # Try cache
        cache_key = f'project:{project_id}:tasks:list'
        cached_data = await get_cache(cache_key)
        if cached_data:
            return [schemas.TaskResponse.model_validate(task) for task in cached_data]

        # First verify project ownership
        result = await db.execute(
            select(Project).where(Project.id == project_id, Project.owner_id == user_id)
        )
        if not result.scalars().first():
            raise HTTPException(status_code=404, detail='Project not found')

        result = await db.execute(
            select(Task).where(Task.project_id == project_id).order_by(Task.id.asc())
        )
        tasks = list(result.scalars().all())

        # Cache results
        tasks_data = [
            schemas.TaskResponse.model_validate(task).model_dump(mode='json')
            for task in tasks
        ]
        await set_cache(cache_key, tasks_data, expire=3600)

        return tasks

    @staticmethod
    async def update_task(
        db: AsyncSession,
        task_id: int,
        task_in: schemas.TaskUpdate,
        user_id: uuid.UUID,
    ) -> Task:
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalars().first()
        if not task:
            raise HTTPException(status_code=404, detail='Task not found')

        # Verify project ownership
        result = await db.execute(
            select(Project).where(
                Project.id == task.project_id, Project.owner_id == user_id
            )
        )
        if not result.scalars().first():
            raise HTTPException(status_code=403, detail='Not enough privileges')

        update_data: dict[str, Any] = task_in.model_dump(exclude_unset=True)
        tags_data = update_data.pop('tags', None)
        incoming_status = update_data.pop('status', None)
        incoming_is_completed = update_data.pop('is_completed', None)

        status, is_completed = TaskService._normalize_task_state(
            status=incoming_status,
            is_completed=incoming_is_completed,
            current_status=task.status,
            current_is_completed=task.is_completed,
        )

        for field, value in update_data.items():
            setattr(task, field, value)

        task.status = status
        task.is_completed = is_completed

        if tags_data is not None:
            task.tags = await TagService.get_or_create_tags(db, tags_data)

        db.add(task)
        await db.commit()
        await db.refresh(task)

        # Invalidate cache
        await clear_cache_pattern(f'project:{task.project_id}:tasks:*')
        await clear_cache_pattern(f'user:{user_id}:analytics')

        return task

    @staticmethod
    async def delete_task(
        db: AsyncSession, task_id: int, user_id: uuid.UUID
    ) -> dict[str, str]:
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalars().first()
        if not task:
            raise HTTPException(status_code=404, detail='Task not found')

        # Verify project ownership
        result = await db.execute(
            select(Project).where(
                Project.id == task.project_id, Project.owner_id == user_id
            )
        )
        if not result.scalars().first():
            raise HTTPException(status_code=403, detail='Not enough privileges')

        project_id = task.project_id
        await db.delete(task)
        await db.commit()

        # Invalidate cache
        await clear_cache_pattern(f'project:{project_id}:tasks:*')
        await clear_cache_pattern(f'user:{user_id}:analytics')

        return {'message': 'Task deleted'}
