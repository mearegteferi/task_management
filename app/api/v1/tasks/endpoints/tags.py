from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.schemas.tag import TagResponse
from app.services.tag_service import TagService

router = APIRouter()

@router.get("/", response_model=List[TagResponse])
async def read_tags(db: AsyncSession = Depends(get_db)):
    """
    Get all available tags.
    """
    return await TagService.get_all(db)