from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.api.v1.tasks.models import TaskStatus
from app.api.v1.tasks.schemas import TaskCreate, TaskResponse, TaskUpdate
from app.api.v1.tasks.services.task_service import TaskService

router = APIRouter()


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
        task_in: TaskCreate,
        db: AsyncSession = Depends(get_db)
):
    """
    Create a new task with optional tags.
    """
    return await TaskService.create(db, task_in)


@router.get("/", response_model=List[TaskResponse])
async def read_tasks(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1),
        status: Optional[TaskStatus] = None,
        priority: Optional[int] = None,
        search: Optional[str] = None,
        db: AsyncSession = Depends(get_db)
):
    """
    Get all tasks with pagination, filtering (status, priority), and search.
    """
    return await TaskService.get_multi(
        db, skip=skip, limit=limit, status=status, priority=priority, search=search
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def read_task(
        task_id: int,
        db: AsyncSession = Depends(get_db)
):
    task = await TaskService.get_one(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or deleted"
        )
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
        task_id: int,
        task_in: TaskUpdate,
        db: AsyncSession = Depends(get_db)
):
    """
    Update a task. Only provided fields will be updated (PATCH).
    """
    task = await TaskService.get_one(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return await TaskService.update(db, task, task_in)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
        task_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Soft delete a task.
    """
    task = await TaskService.get_one(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await TaskService.delete(db, task)
    return None


@router.post("/{task_id}/restore", response_model=TaskResponse)
async def restore_task(
        task_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Restore a soft-deleted task.
    """
    task = await TaskService.restore(db, task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found or not in deleted state"
        )
    return task