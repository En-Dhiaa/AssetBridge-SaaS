from typing import Optional, Any, Dict
import json
import time
import redis.asyncio as aioredis
from app.config import settings

# Global in-memory fallback cache for local dev when Redis is not running
_memory_cache: Dict[str, tuple[str, float]] = {}


class CacheManager:
    _redis_client: Optional[aioredis.Redis] = None
    _redis_available: Optional[bool] = None

    @classmethod
    def get_redis(cls) -> Optional[aioredis.Redis]:
        if cls._redis_client is None and cls._redis_available is not False:
            try:
                cls._redis_client = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=1.5
                )
            except Exception:
                cls._redis_available = False
        return cls._redis_client

    @classmethod
    async def get_cached_json(cls, key: str) -> Optional[Any]:
        r = cls.get_redis()
        if r and cls._redis_available is not False:
            try:
                val = await r.get(key)
                if val:
                    return json.loads(val)
                return None
            except Exception:
                cls._redis_available = False

        # In-memory fallback
        if key in _memory_cache:
            val_str, expires_at = _memory_cache[key]
            if time.time() < expires_at:
                try:
                    return json.loads(val_str)
                except Exception:
                    pass
            else:
                del _memory_cache[key]
        return None

    @classmethod
    async def set_cached_json(cls, key: str, data: Any, ttl_seconds: int = 600) -> None:
        val_str = json.dumps(data)
        r = cls.get_redis()
        if r and cls._redis_available is not False:
            try:
                await r.setex(key, ttl_seconds, val_str)
                return
            except Exception:
                cls._redis_available = False

        # In-memory fallback
        _memory_cache[key] = (val_str, time.time() + ttl_seconds)

    @classmethod
    async def delete_key(cls, key: str) -> None:
        r = cls.get_redis()
        if r and cls._redis_available is not False:
            try:
                await r.delete(key)
            except Exception:
                pass
        _memory_cache.pop(key, None)


def get_redis_client() -> Optional[aioredis.Redis]:
    return CacheManager.get_redis()
