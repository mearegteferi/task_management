import logging
from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core import redis as redis_module
from app.core.config import settings

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    redis_module.redis_client = redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
    )
    logger.info('Redis client initialized')

    yield

    if redis_module.redis_client:
        await redis_module.redis_client.aclose()
        logger.info('Redis client closed')


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

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
