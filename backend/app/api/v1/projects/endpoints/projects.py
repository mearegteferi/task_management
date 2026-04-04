from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.api.v1.projects.models import ProjectStatus
from app.api.v1.projects.schemas import ProjectCreate, ProjectResponse, ProjectUpdate
from app.api.v1.projects.services.project_service import ProjectService

router = APIRouter()


@router.post('/', response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new project for the current user.
    """
    return await ProjectService.create(db, project_in, owner_id=current_user.id)


@router.get('/', response_model=list[ProjectResponse])
async def read_projects(
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    status: ProjectStatus | None = None,
    priority: int | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get current user's projects.
    """
    return await ProjectService.get_multi(
        db,
        owner_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status,
        priority=priority,
        search=search,
    )


@router.get('/{project_id}', response_model=ProjectResponse)
async def read_project(
    project_id: int, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> Any:
    # Pass owner_id to ensure they don't see other people's projects
    project = await ProjectService.get_one(db, project_id, owner_id=current_user.id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='Project not found'
        )
    return project


@router.patch('/{project_id}', response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # First, verify existence and ownership
    project = await ProjectService.get_one(db, project_id, owner_id=current_user.id)

    if not project:
        raise HTTPException(status_code=404, detail='Project not found')

    return await ProjectService.update(db, project, project_in)


@router.delete('/{project_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> None:
    # Verify ownership before deleting
    project = await ProjectService.get_one(db, project_id, owner_id=current_user.id)

    if not project:
        raise HTTPException(status_code=404, detail='Project not found')

    await ProjectService.delete(db, project)
    return None


@router.post('/{project_id}/restore', response_model=ProjectResponse)
async def restore_project(
    project_id: int, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> Any:
    # Verify ownership before restoring
    project = await ProjectService.restore(db, project_id, owner_id=current_user.id)

    if not project:
        raise HTTPException(
            status_code=404, detail='Project not found in deleted items'
        )
    return project
