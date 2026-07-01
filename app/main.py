from unittest import result
from fastapi import FastAPI
from sqlalchemy import text
from app.db.dependencies import get_db

app = FastAPI(
    title="SupportAI",
    description="AI-powered customer support platform",
    version="0.1.0",
)

@app.get("/")
async def root():
    return {"message": "Welcome to SupportAI"}

@app.get("/db-test")
async def db_test():
    async for db in get_db():
        result = await db.execute(text("SELECT 1"))
        return {"result": result.scalar()}

