from fastapi import Depends, Request
from redis.asyncio import Redis

from app.core.rate_limiter import RateLimiter
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.redis.dependencies import get_redis
from app.redis.keys import RedisKeys


def rate_limit_ip(times: int, seconds: int):
    """Rate limit dependency factory based on Client IP Address."""
    async def dependency(
        request: Request,
        redis: Redis = Depends(get_redis),
    ):
        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path
        key = RedisKeys.rate_limit_ip(client_ip, path)

        limiter = RateLimiter(redis=redis, times=times, seconds=seconds)
        await limiter.check(key)

    return dependency


def rate_limit_user(times: int, seconds: int):
    """Rate limit dependency factory based on Authenticated User ID."""
    async def dependency(
        request: Request,
        redis: Redis = Depends(get_redis),
        current_user: User = Depends(get_current_user),
    ):
        path = request.url.path
        key = RedisKeys.rate_limit_user(str(current_user.id), path)

        limiter = RateLimiter(redis=redis, times=times, seconds=seconds)
        await limiter.check(key)

    return dependency
