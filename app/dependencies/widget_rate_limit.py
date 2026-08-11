import hashlib
from fastapi import Request
from redis.asyncio import Redis
from app.exceptions.rate_limit import RateLimitExceededException
from app.redis.client import get_redis


async def check_widget_rate_limit(
    request: Request,
    limit: int = 20,
    window_seconds: int = 60,
) -> None:
    """
    Sliding-window rate limiter per client IP address (20 requests per 60 seconds).
    Protects public widget endpoints from DDoS and quota drain attacks.
    """
    redis_client: Redis = get_redis()
    
    # Extract client IP (handle proxies & direct connections)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    elif request.client and request.client.host:
        client_ip = request.client.host
    else:
        client_ip = "unknown"

    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16]
    key = f"rate_limit:widget:ip:{ip_hash}"

    try:
        current_count = await redis_client.incr(key)
        if current_count == 1:
            await redis_client.expire(key, window_seconds)
        
        if current_count > limit:
            raise RateLimitExceededException()
    except RateLimitExceededException:
        raise
    except Exception:
        # If Redis is temporarily unreachable, allow request to proceed gracefully
        pass
