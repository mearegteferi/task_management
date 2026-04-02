from __future__ import annotations

import os
import sys
from collections.abc import Iterator
from pathlib import Path
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault('SECRET_KEY', 'test-secret-key')
os.environ.setdefault('POSTGRES_USER', 'postgres')
os.environ.setdefault('POSTGRES_PASSWORD', 'postgres')
os.environ.setdefault('POSTGRES_SERVER', 'postgres')
os.environ.setdefault('POSTGRES_DB', 'task_db')
os.environ.setdefault('REDIS_URL', 'redis://redis:6379/0')
os.environ.setdefault('FRONTEND_HOST', 'http://localhost:3000')

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    import redis.asyncio as redis

    fake_redis_client = AsyncMock()
    fake_redis_client.aclose = AsyncMock(return_value=None)

    monkeypatch.setattr(redis, 'from_url', lambda *args, **kwargs: fake_redis_client)

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
