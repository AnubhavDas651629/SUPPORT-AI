#using the sliding window log rate limiter
from httpcore import request
import time
from redis.asyncio import Redis
from app.exceptions.auth import RateLimitExceededException


#times -> number of allowed request
#seconds -> Time interval window
class RateLimiter:
    def __init__(self, *, redis: Redis, times: int, seconds:int):
        self.redis = redis
        self.times = times
        self.seconds = seconds

    async def check(self, key: str) -> None:
        """
        Executes Sliding Window Log check in Redis.
        Raises RateLimitExceededException if request limit is exceeded.
        """

        now = time.time()
        window_start = now - self.seconds

        #redis.pipline will help send zremrangebyscore and zcard together for redis to implement
        #transaction = True will ensure that in a race condition, request #1 completes entire seqeunce before #2 can touch redis
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zcard(key)
            results = await pipe.execute()

        request_count = results[1]

        if request_count >= self.times:
            oldest_timestamp = await self.redis.zrange(key, 0, 0, withscores=True)
            if oldest_timestamp:
                oldest_time = oldest_timestamp[0][1]
                retry_after = max(1, int(self.seconds - (now - oldest_time)))
            else:
                retry_after = self.seconds
            raise RateLimitExceededException(retry_after=retry_after, limit=self.times)
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, self.seconds)
            await pipe.execute()

