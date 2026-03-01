from fastapi import APIRouter

from app.api.v1.tasks.endpoints import tags, tasks

router = APIRouter()

# Include tags router under /tasks/tags
router.include_router(tags.router, prefix='/tags', tags=['Tags'])
router.include_router(tasks.router, prefix='/tasks', tags=['Tasks'])
