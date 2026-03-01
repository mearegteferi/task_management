from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import redis.asyncio as redis

from app.api.v1.router import api_router
from app.core.config import settings
from app.core import redis as redis_module


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    # Initialize the Redis connection pool
    redis_module.redis_client = redis.from_url(
        settings.REDIS_URL,
        decode_responses=True
    )
    print("✅ Successfully connected to Redis!")

    yield

    if redis_module.redis_client:
        await redis_module.redis_client.aclose()
        print("🛑 Disconnected from Redis.")


app = FastAPI(lifespan=lifespan)

if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get('/health')
async def health_check() -> dict[str, str]:
    return {'status': 'ok'}
