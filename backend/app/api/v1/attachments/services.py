import os
import uuid

import aiofiles
from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.attachments.models import Attachment
from app.api.v1.tasks.models import Task

# Handle upload directory creation at the service/infrastructure level
UPLOAD_DIR = 'uploads'
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


class AttachmentService:
    @staticmethod
    async def create_attachment(
        db: AsyncSession, task_id: int, file: UploadFile, user_id: uuid.UUID
    ) -> Attachment:
        # Verify task exists
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalars().first()
        if not task:
            raise HTTPException(status_code=404, detail='Task not found')

        # Optional: You can add an ownership/authorization check here using user_id
        # to ensure the user actually has permission to add files to this task

        # Save file to disk
        filename = file.filename or 'unnamed_file'
        file_path = os.path.join(UPLOAD_DIR, filename)
        async with aiofiles.open(file_path, 'wb') as buffer:
            content = await file.read()
            await buffer.write(content)

        # Save record to database
        attachment = Attachment(
            filename=filename,
            file_path=file_path,
            file_type=file.content_type,
            task_id=task_id,
        )
        db.add(attachment)
        await db.commit()
        await db.refresh(attachment)
        return attachment

    @staticmethod
    async def get_attachments(
        db: AsyncSession, task_id: int, user_id: uuid.UUID
    ) -> list[Attachment]:
        # Optional: You can add an ownership/authorization check here using user_id

        result = await db.execute(
            select(Attachment)
            .where(Attachment.task_id == task_id)
            .order_by(Attachment.uploaded_at.asc())
        )
        return list(result.scalars().all())
