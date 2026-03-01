from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.api.v1.comments import schemas

# Adjust this import to match your project's directory structure
from app.api.v1.comments.services import CommentService

router = APIRouter()

@router.post("/tasks/{task_id}/comments/", response_model=schemas.CommentResponse)
async def create_comment(
    task_id: int,
    comment_in: schemas.CommentCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Add a comment to a task.
    """
    return await CommentService.create_comment(
        db=db,
        task_id=task_id,
        comment_in=comment_in,
        user_id=current_user.id
    )

@router.get("/tasks/{task_id}/comments/", response_model=list[schemas.CommentResponse])
async def read_comments(
    task_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get all comments for a task.
    """
    return await CommentService.get_comments(
        db=db,
        task_id=task_id,
        user_id=current_user.id
    )
