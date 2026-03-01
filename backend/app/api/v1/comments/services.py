import uuid
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.comments import schemas
from app.api.v1.comments.models import Comment
from app.api.v1.tasks.models import Task


class CommentService:
    @staticmethod
    async def create_comment(
        db: AsyncSession, task_id: int, comment_in: schemas.CommentCreate, user_id: uuid.UUID
    ) -> Comment:
        # Verify the task exists
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalars().first()
        if not task:
            raise HTTPException(status_code=404, detail='Task not found')

        # Optional: Add authorization check here to ensure `user_id` has access to this task

        # Create the comment
        comment = Comment(**comment_in.model_dump(), task_id=task_id, user_id=user_id)
        db.add(comment)
        await db.commit()
        await db.refresh(comment)
        return comment

    @staticmethod
    async def get_comments(
        db: AsyncSession, task_id: int, user_id: uuid.UUID
    ) -> list[Comment]:
        # Optional: Add authorization check here to ensure `user_id` has access to this task

        result = await db.execute(
            select(Comment)
            .where(Comment.task_id == task_id)
            .order_by(Comment.created_at.asc())
        )
        return list(result.scalars().all())
