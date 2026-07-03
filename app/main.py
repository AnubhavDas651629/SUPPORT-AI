from unittest import result
from fastapi import FastAPI
from sqlalchemy import text
from app.db.dependencies import get_db
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.core.exception_handlers import (register_exception_handlers)


app = FastAPI(
    title="SupportAI",
    description="AI-powered customer support platform",
    version="0.1.0",
)

register_exception_handlers(app)

app.include_router(
    auth_router,
    prefix="/api/v1",
)

app.include_router(
    users_router,
    prefix="/api/v1",
)

@app.get("/")
async def root():
    return {"message": "Welcome to SupportAI"}

@app.get("/db-test")
async def db_test():
    async for db in get_db():
        result = await db.execute(text("SELECT 1"))
        return {"result": result.scalar()}

