import re
import uuid
from pathlib import Path

import aiofiles
from anyio import Path as AsyncPath
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.attachments.models import Attachment
from app.api.v1.projects.models import Project
from app.api.v1.tasks.models import Task
from app.core.config import settings

UPLOAD_DIR = settings.upload_dir_path
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SAFE_FILENAME_PATTERN = re.compile(r'[^A-Za-z0-9._-]+')


class AttachmentService:
    @staticmethod
    def _sanitize_filename(filename: str | None) -> str:
        original_name = Path(filename or 'unnamed-file').name
        cleaned_name = SAFE_FILENAME_PATTERN.sub('_', original_name).strip('._')
        return cleaned_name or 'attachment'

    @staticmethod
    def _resolve_stored_path(stored_filename: str) -> Path:
        candidate = (UPLOAD_DIR / stored_filename).resolve()
        if candidate.parent != UPLOAD_DIR:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid attachment path.',
            )
        return candidate

    @staticmethod
    async def _get_owned_task(
        db: AsyncSession,
        task_id: int,
        user_id: uuid.UUID,
    ) -> Task:
        result = await db.execute(
            select(Task)
            .join(Project)
            .where(
                Task.id == task_id,
                Project.owner_id == user_id,
                Project.is_deleted.is_(False),
            )
        )
        task = result.scalars().first()
        if not task:
            raise HTTPException(status_code=404, detail='Task not found')
        return task

    @staticmethod
    async def _get_owned_attachment(
        db: AsyncSession,
        attachment_id: int,
        user_id: uuid.UUID,
    ) -> Attachment:
        result = await db.execute(
            select(Attachment)
            .options(selectinload(Attachment.task).selectinload(Task.project))
            .join(Task)
            .join(Project)
            .where(
                Attachment.id == attachment_id,
                Project.owner_id == user_id,
                Project.is_deleted.is_(False),
            )
        )
        attachment = result.scalars().first()
        if not attachment:
            raise HTTPException(status_code=404, detail='Attachment not found')
        return attachment

    @staticmethod
    async def create_attachment(
        db: AsyncSession,
        task_id: int,
        file: UploadFile,
        user_id: uuid.UUID,
    ) -> Attachment:
        await AttachmentService._get_owned_task(db=db, task_id=task_id, user_id=user_id)

        original_filename = AttachmentService._sanitize_filename(file.filename)
        stored_filename = f'{uuid.uuid4()}-{original_filename}'
        file_path = AttachmentService._resolve_stored_path(stored_filename)
        bytes_written = 0

        try:
            async with aiofiles.open(file_path, 'wb') as buffer:
                while chunk := await file.read(1024 * 1024):
                    bytes_written += len(chunk)
                    if bytes_written > settings.MAX_UPLOAD_SIZE_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=(
                                'Attachment exceeds the maximum allowed size of '
                                f'{settings.MAX_UPLOAD_SIZE_BYTES} bytes.'
                            ),
                        )
                    await buffer.write(chunk)

            attachment = Attachment(
                filename=original_filename,
                file_path=str(file_path),
                file_type=file.content_type,
                task_id=task_id,
            )
            db.add(attachment)
            await db.commit()
            await db.refresh(attachment)
            return attachment
        except Exception:
            await db.rollback()
            if file_path.exists():
                file_path.unlink(missing_ok=True)
            raise
        finally:
            await file.close()

    @staticmethod
    async def get_attachments(
        db: AsyncSession,
        task_id: int,
        user_id: uuid.UUID,
    ) -> list[Attachment]:
        await AttachmentService._get_owned_task(db=db, task_id=task_id, user_id=user_id)

        result = await db.execute(
            select(Attachment)
            .where(Attachment.task_id == task_id)
            .order_by(Attachment.uploaded_at.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_attachment_for_download(
        db: AsyncSession,
        attachment_id: int,
        user_id: uuid.UUID,
    ) -> Attachment:
        attachment = await AttachmentService._get_owned_attachment(
            db=db,
            attachment_id=attachment_id,
            user_id=user_id,
        )

        file_path = AttachmentService._resolve_stored_path(Path(attachment.file_path).name)
        if not await AsyncPath(file_path).is_file():
            raise HTTPException(status_code=404, detail='Attachment file not found')

        return attachment
