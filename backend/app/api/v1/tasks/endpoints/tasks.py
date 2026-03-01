from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.api.v1.tasks import schemas

# Adjust this import to wherever you placed the service file above
from app.api.v1.tasks.services.task_service import TaskService

router = APIRouter()


@router.post('/projects/{project_id}/tasks/', response_model=schemas.TaskResponse)
async def create_task(
    project_id: int,
    task_in: schemas.TaskCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new task for a specific project.
    """
    return await TaskService.create_task(
        db=db, project_id=project_id, task_in=task_in, user_id=current_user.id
    )


@router.get('/projects/{project_id}/tasks/', response_model=list[schemas.TaskResponse])
async def read_tasks(
    project_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get all tasks for a project.
    """
    return await TaskService.get_tasks(
        db=db, project_id=project_id, user_id=current_user.id
    )


@router.patch('/tasks/{task_id}', response_model=schemas.TaskResponse)
async def update_task(
    task_id: int,
    task_in: schemas.TaskUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Update a task (e.g. toggle completion).
    """
    return await TaskService.update_task(
        db=db, task_id=task_id, task_in=task_in, user_id=current_user.id
    )


@router.delete('/tasks/{task_id}')
async def delete_task(
    task_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Delete a task.
    """
    return await TaskService.delete_task(
        db=db, task_id=task_id, user_id=current_user.id
    )
