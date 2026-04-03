from typing import Any

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.api.v1.attachments import schemas
from app.api.v1.attachments.services import AttachmentService

router = APIRouter()


@router.post('/tasks/{task_id}/attachments/', response_model=schemas.AttachmentResponse)
async def create_attachment(
    task_id: int,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    return await AttachmentService.create_attachment(
        db=db, task_id=task_id, file=file, user_id=current_user.id
    )


@router.get(
    '/tasks/{task_id}/attachments/', response_model=list[schemas.AttachmentResponse]
)
async def read_attachments(
    task_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Any:
    return await AttachmentService.get_attachments(
        db=db, task_id=task_id, user_id=current_user.id
    )


@router.get('/attachments/{attachment_id}/download')
async def download_attachment(
    attachment_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    attachment = await AttachmentService.get_attachment_for_download(
        db=db,
        attachment_id=attachment_id,
        user_id=current_user.id,
    )
    return FileResponse(
        path=attachment.file_path,
        filename=attachment.filename,
        media_type=attachment.file_type or 'application/octet-stream',
    )
