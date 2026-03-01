from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import CurrentUser, get_db
from app.api.v1.analytics import schemas
from app.api.v1.analytics.services import AnalyticsService
from app.core.redis import get_cache, set_cache

router = APIRouter()

@router.get("/", response_model=schemas.AnalyticsResponse)
async def get_analytics(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get analytics for the current user.
    """
    cache_key = f"user:{current_user.id}:analytics"
    
    # Try to get from cache
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data
    
    # If not in cache, get from DB
    analytics_data = await AnalyticsService.get_analytics(db=db, user_id=current_user.id)
    
    # Store in cache for 5 minutes (300 seconds)
    await set_cache(cache_key, analytics_data, expire=300)
    
    return analytics_data
