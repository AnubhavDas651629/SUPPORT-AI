from redis.asyncio import Redis
from app.redis.client import redis_client

def get_redis() -> Redis:
    return redis_client



