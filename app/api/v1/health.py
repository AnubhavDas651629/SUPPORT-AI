# This code will try to execute a simple "SELECT 1" on Postgres and a simple "PING" on Redis. If both succeed, it returns status: ok

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from redis.asyncio import Redis
from app.db.dependencies import get_db
from app.redis.dependencies import get_redis

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("")
async def health_check(
    db = Depends(get_db),
    redis: Redis = Depends(get_redis)
):
    try:
        #check database
        await db.execute(text("SELECT 1"))

        #check redis
        await redis.ping()

        return {
            "status": "ok",
            "database": "connected",
            "redis": "connected"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"status": "unhealthy", "error": str(e)}
        )