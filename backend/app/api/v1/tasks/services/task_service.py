from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import Optional, List
import uuid

from app.api.v1.tasks.models import Task, TaskStatus
from app.api.v1.tasks.schemas import TaskCreate, TaskUpdate
from app.api.v1.tasks.services.tag_service import TagService


class TaskService:
    @staticmethod
    async def create(db: AsyncSession, task_in: TaskCreate, owner_id: uuid.UUID) -> Task:
        # 1. Resolve Tags
        tags = await TagService.get_or_create_tags(db, task_in.tags)

        # 2. Create Task with owner_id
        db_task = Task(
            title=task_in.title,
            description=task_in.description,
            status=task_in.status,
            priority=task_in.priority,
            due_date=task_in.due_date,
            tags=tags,
            owner_id=owner_id  # <--- ASSIGN OWNER
        )
        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)
        return db_task

    @staticmethod
    async def get_multi(
            db: AsyncSession,
            owner_id: uuid.UUID,  # <--- REQUIRE OWNER ID
            skip: int = 0,
            limit: int = 100,
            status: Optional[TaskStatus] = None,
            priority: Optional[int] = None,
            search: Optional[str] = None
    ) -> List[Task]:

        # Filter by owner_id AND is_deleted=False
        query = select(Task).where(
            and_(
                Task.owner_id == owner_id,
                Task.is_deleted == False
            )
        )

        # Apply Filters dynamically
        if status:
            query = query.where(Task.status == status)
        if priority:
            query = query.where(Task.priority == priority)
        if search:
            query = query.where(
                or_(
                    Task.title.ilike(f"%{search}%"),
                    Task.description.ilike(f"%{search}%")
                )
            )

        query = query.order_by(Task.created_at.desc()).offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_one(
            db: AsyncSession,
            task_id: int,
            owner_id: uuid.UUID  # <--- REQUIRE OWNER ID
    ) -> Optional[Task]:
        # Only return if ID matches AND Owner matches
        query = select(Task).where(
            Task.id == task_id,
            Task.owner_id == owner_id,  # Security check
            Task.is_deleted == False
        )
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def update(db: AsyncSession, db_task: Task, task_update: TaskUpdate) -> Task:
        # Update logic remains mostly the same, as db_task is already validated in the endpoint
        update_data = task_update.model_dump(exclude_unset=True)
        tags_data = update_data.pop("tags", None)

        for field, value in update_data.items():
            setattr(db_task, field, value)

        if tags_data is not None:
            db_task.tags = await TagService.get_or_create_tags(db, task_update.tags)

        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)
        return db_task

    @staticmethod
    async def delete(db: AsyncSession, db_task: Task) -> None:
        db_task.is_deleted = True
        db.add(db_task)
        await db.commit()

    @staticmethod
    async def restore(
            db: AsyncSession,
            task_id: int,
            owner_id: uuid.UUID  # <--- REQUIRE OWNER ID
    ) -> Optional[Task]:
        # Can only restore YOUR OWN deleted tasks
        query = select(Task).where(
            Task.id == task_id,
            Task.owner_id == owner_id,
            Task.is_deleted == True
        )
        result = await db.execute(query)
        db_task = result.scalars().first()

        if db_task:
            db_task.is_deleted = False
            db.add(db_task)
            await db.commit()
            await db.refresh(db_task)

        return db_task