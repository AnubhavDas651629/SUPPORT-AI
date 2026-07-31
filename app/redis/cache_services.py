import json
from typing import Any, TypeVar, Type
from pydantic import BaseModel
from redis.asyncio import Redis

T = TypeVar("T", bound=BaseModel)

class RedisCacheService:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def get_json(self,*, key: str, schema_cls: Type[T]) -> T | None:
        """ Fetch JSON string from redis and deserialize into Pydantic schema
            (Basically extracts the data stored in redis and sends for pydantic validation for feeding an api call)
        """

        data = await self.redis.get(key)
        if not data:
            return None
        try:
            return schema_cls.model_validate_json(data)
        except Exception:
            # If schema validation fails, evixt invalid cache
            await self.delete(key)
            return None

    async def set_json(self,*, key: str, value: BaseModel, ttl: int = 3600) -> None:
        """Serialize Pydantic schema to JSON and store in Redis with ttl"""
        json_data = value.model_dump_json()
        await self.redis.set(key, json_data, ex=ttl)


    async def delete(self, *, key:str) -> None:
        """Evict a specific cache from redis"""
        await self.redis.delete(key)

    async def get_raw(self, key: str) -> str | None:
        """To fetch raw string value from redis"""
        return await self.redis.get(key)

    async def set_raw(self, key: str, value: str, ttl:int = 3600) -> None:
        await self.redis.set(key, value, ex = ttl)



        