from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.api.v1.tasks.models import TaskStatus
from app.api.v1.tasks.schemas import TaskCreate, TaskResponse, TaskUpdate
from app.api.v1.tasks.services.task_service import TaskService
# Import the CurrentUser dependency you created
from app.api.v1.users.dependencies import CurrentUser, get_db

router = APIRouter()


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
        task_in: TaskCreate,
        current_user: CurrentUser,  # <--- 1. Inject User
        db: AsyncSession = Depends(get_db)
):
    """
    Create a new task for the current user.
    """
    # 2. Pass user ID to service
    return await TaskService.create(db, task_in, owner_id=current_user.id)


@router.get("/", response_model=List[TaskResponse])
async def read_tasks(
        current_user: CurrentUser,  # <--- Inject User
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1),
        status: Optional[TaskStatus] = None,
        priority: Optional[int] = None,
        search: Optional[str] = None,
        db: AsyncSession = Depends(get_db)
):
    """
    Get current user's tasks.
    """
    return await TaskService.get_multi(
        db,
        owner_id=current_user.id,  # <--- Filter by user ID
        skip=skip,
        limit=limit,
        status=status,
        priority=priority,
        search=search
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def read_task(
        task_id: int,
        current_user: CurrentUser,  # <--- Inject User
        db: AsyncSession = Depends(get_db)
):
    # Pass owner_id to ensure they don't see other people's tasks
    task = await TaskService.get_one(db, task_id, owner_id=current_user.id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
        task_id: int,
        task_in: TaskUpdate,
        current_user: CurrentUser,  # <--- Inject User
        db: AsyncSession = Depends(get_db)
):
    # First, verify existence and ownership
    task = await TaskService.get_one(db, task_id, owner_id=current_user.id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return await TaskService.update(db, task, task_in)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
        task_id: int,
        current_user: CurrentUser,  # <--- Inject User
        db: AsyncSession = Depends(get_db)
):
    # Verify ownership before deleting
    task = await TaskService.get_one(db, task_id, owner_id=current_user.id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await TaskService.delete(db, task)
    return None


@router.post("/{task_id}/restore", response_model=TaskResponse)
async def restore_task(
        task_id: int,
        current_user: CurrentUser,  # <--- Inject User
        db: AsyncSession = Depends(get_db)
):
    # Verify ownership before restoring
    task = await TaskService.restore(db, task_id, owner_id=current_user.id)

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found in deleted items"
        )
    return task