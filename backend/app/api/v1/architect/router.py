from fastapi import APIRouter, Depends, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.api.v1.architect.schemas import (
    ArchitectChatRequest,
    ArchitectConfirmRequest,
    ArchitectConfirmResponse,
    ArchitectDraftResponse,
    SuggestProjectRequest,
)
from app.api.v1.architect.service import ArchitectService
from app.core.redis import get_redis

router = APIRouter(prefix='/architect')


@router.post('/suggest', response_model=ArchitectDraftResponse)
async def suggest_project_breakdown(
    project_request: SuggestProjectRequest,
    current_user: CurrentUser,
    redis: Redis = Depends(get_redis),
) -> ArchitectDraftResponse:
    session_id, draft = await ArchitectService.suggest(
        redis, current_user.id, project_request
    )
    return ArchitectDraftResponse(session_id=session_id, draft=draft)


@router.post('/chat', response_model=ArchitectDraftResponse)
async def refine_project_breakdown(
    feedback: ArchitectChatRequest,
    current_user: CurrentUser,
    redis: Redis = Depends(get_redis),
) -> ArchitectDraftResponse:
    draft = await ArchitectService.chat(redis, current_user.id, feedback)
    return ArchitectDraftResponse(session_id=feedback.session_id, draft=draft)


@router.post(
    '/confirm',
    response_model=ArchitectConfirmResponse,
    status_code=status.HTTP_201_CREATED,
)
async def confirm_project_breakdown(
    confirm_request: ArchitectConfirmRequest,
    current_user: CurrentUser,
    redis: Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
) -> ArchitectConfirmResponse:
    return await ArchitectService.confirm(
        db,
        redis,
        current_user.id,
        confirm_request,
    )
