from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.redis.client import redis_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    print("Starting SupportAI...")

    yield

    # Shutdown code
    print("Shutting down SupportAI...")
    await redis_client.aclose()