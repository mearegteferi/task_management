import json
from typing import Any
import redis.asyncio as redis
from app.core.config import settings

# Global variable to hold the connection pool
redis_client: redis.Redis | None = None

async def get_redis() -> redis.Redis:
    """
    Dependency to be injected into FastAPI routes.
    """
    if redis_client is None:
        raise ConnectionError("Redis client is not initialized!")
    return redis_client

async def set_cache(key: str, value: Any, expire: int = 3600) -> None:
    """
    Store data in Redis as JSON.
    """
    if redis_client:
        await redis_client.set(key, json.dumps(value), ex=expire)

async def get_cache(key: str) -> Any | None:
    """
    Retrieve and deserialize JSON data from Redis.
    """
    if redis_client:
        data = await redis_client.get(key)
        if data:
            return json.loads(data)
    return None

async def delete_cache(key: str) -> None:
    """
    Remove a specific key from Redis.
    """
    if redis_client:
        await redis_client.delete(key)

async def clear_cache_pattern(pattern: str) -> None:
    """
    Remove all keys matching a pattern.
    """
    if redis_client:
        # Note: keys() can be slow on large datasets, but for this scale it's fine.
        # For production-scale, SCAN should be used.
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)