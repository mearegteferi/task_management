from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.tasks.router import api_router

app = FastAPI()

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "ok"}