from typing import Optional, Any
import json
import redis.asyncio as aioredis
from app.config import settings

redis_pool = aioredis.ConnectionPool.from_url(
    settings.REDIS_URL,
    max_connections=50,
    decode_responses=True
)


def get_redis_client() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=redis_pool)


class CacheManager:
    @staticmethod
    async def get_cached_json(key: str) -> Optional[Any]:
        r = get_redis_client()
        val = await r.get(key)
        if val:
            try:
                return json.loads(val)
            except Exception:
                return None
        return None

    @staticmethod
    async def set_cached_json(key: str, data: Any, ttl_seconds: int = 600) -> None:
        r = get_redis_client()
        await r.setex(key, ttl_seconds, json.dumps(data))

    @staticmethod
    async def delete_key(key: str) -> None:
        r = get_redis_client()
        await r.delete(key)
