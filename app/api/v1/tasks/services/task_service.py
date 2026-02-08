from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Optional, List
from datetime import datetime

from app.api.v1.tasks.models import Task, TaskStatus
from app.api.v1.tasks.schemas import TaskCreate, TaskUpdate
from app.api.v1.tasks.services.tag_service import TagService


class TaskService:
    @staticmethod
    async def create(db: AsyncSession, task_in: TaskCreate) -> Task:
        # 1. Resolve Tags
        tags = await TagService.get_or_create_tags(db, task_in.tags)

        # 2. Create Task
        db_task = Task(
            title=task_in.title,
            description=task_in.description,
            status=task_in.status,
            priority=task_in.priority,
            due_date=task_in.due_date,
            tags=tags
        )
        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)
        return db_task

    @staticmethod
    async def get_multi(
            db: AsyncSession,
            skip: int = 0,
            limit: int = 100,
            status: Optional[TaskStatus] = None,
            priority: Optional[int] = None,
            search: Optional[str] = None
    ) -> List[Task]:
        # Start with base query filtering out soft-deleted items
        query = select(Task).where(Task.is_deleted == False)

        # Apply Filters dynamically
        if status:
            query = query.where(Task.status == status)
        if priority:
            query = query.where(Task.priority == priority)
        if search:
            # Case-insensitive search on title OR description
            query = query.where(
                or_(
                    Task.title.ilike(f"%{search}%"),
                    Task.description.ilike(f"%{search}%")
                )
            )

        # Apply Pagination and Order by Creation
        query = query.order_by(Task.created_at.desc()).offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_one(db: AsyncSession, task_id: int) -> Optional[Task]:
        # We also want to see soft-deleted tasks if querying by specific ID (optional choice)
        # But usually, we only show active ones.
        query = select(Task).where(Task.id == task_id, Task.is_deleted == False)
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def update(db: AsyncSession, db_task: Task, task_update: TaskUpdate) -> Task:
        # 1. Update Scalar Fields
        update_data = task_update.model_dump(exclude_unset=True)  # Only fields sent by user

        # Pop tags from data to handle separately
        tags_data = update_data.pop("tags", None)

        for field, value in update_data.items():
            setattr(db_task, field, value)

        # 2. Update Tags (if provided)
        if tags_data is not None:
            # This replaces existing tags with the new list
            db_task.tags = await TagService.get_or_create_tags(db, task_update.tags)

        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)
        return db_task

    @staticmethod
    async def delete(db: AsyncSession, db_task: Task) -> None:
        # Soft Delete
        db_task.is_deleted = True
        db.add(db_task)
        await db.commit()

    @staticmethod
    async def restore(db: AsyncSession, task_id: int) -> Optional[Task]:
        # Find the deleted task
        query = select(Task).where(Task.id == task_id, Task.is_deleted == True)
        result = await db.execute(query)
        db_task = result.scalars().first()

        if db_task:
            db_task.is_deleted = False
            db.add(db_task)
            await db.commit()
            await db.refresh(db_task)

        return db_task