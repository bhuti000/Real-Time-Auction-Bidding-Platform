import asyncio
from datetime import datetime, timedelta
from typing import Protocol

import redis.asyncio as redis
from fastapi import HTTPException, Request, status

from app.config import settings

RATE_LIMIT_KEY_PREFIX = "rl:auth:"


class _RateLimiterBackend(Protocol):
    async def hit(self, key: str, limit: int, window_seconds: int) -> tuple[int, int]: ...

    async def clear(self, prefix: str) -> None: ...

    async def close(self) -> None: ...


class _RedisRateLimiterBackend:
    def __init__(self, client: redis.Redis):
        self.client = client

    async def hit(self, key: str, limit: int, window_seconds: int) -> tuple[int, int]:
        pipeline = self.client.pipeline()
        pipeline.incr(key)
        pipeline.ttl(key)
        current, ttl = await pipeline.execute()
        if int(current) == 1 or int(ttl) < 0:
            await self.client.expire(key, window_seconds)
            ttl = window_seconds
        return int(current), int(ttl)

    async def clear(self, prefix: str) -> None:
        cursor = 0
        match = f"{prefix}*"
        while True:
            cursor, keys = await self.client.scan(cursor=cursor, match=match, count=500)
            if keys:
                await self.client.delete(*keys)
            if cursor == 0:
                break

    async def close(self) -> None:
        close_method = getattr(self.client, "aclose", None)
        if close_method is not None:
            await close_method()
            return
        await self.client.close()


class _InMemoryRateLimiterBackend:
    def __init__(self):
        self._store: dict[str, tuple[int, datetime]] = {}
        self._lock = asyncio.Lock()

    async def hit(self, key: str, limit: int, window_seconds: int) -> tuple[int, int]:
        async with self._lock:
            now = datetime.utcnow()
            current, reset_at = self._store.get(key, (0, now + timedelta(seconds=window_seconds)))
            if now >= reset_at:
                current = 0
                reset_at = now + timedelta(seconds=window_seconds)
            current += 1
            self._store[key] = (current, reset_at)
            ttl = max(int((reset_at - now).total_seconds()), 0)
            return current, ttl

    async def clear(self, prefix: str) -> None:
        async with self._lock:
            keys = [key for key in self._store if key.startswith(prefix)]
            for key in keys:
                self._store.pop(key, None)

    async def close(self) -> None:
        return


_backend: _RateLimiterBackend | None = None
_backend_lock = asyncio.Lock()
_redis_client_override: redis.Redis | None = None


def set_rate_limiter_redis_client(client: redis.Redis | None) -> None:
    global _redis_client_override, _backend
    _redis_client_override = client
    _backend = None


async def init_rate_limiter() -> None:
    global _backend
    if _backend is not None:
        return

    async with _backend_lock:
        if _backend is not None:
            return

        if _redis_client_override is not None:
            _backend = _RedisRateLimiterBackend(_redis_client_override)
            return

        client = redis.from_url(settings.redis_url, decode_responses=True)
        try:
            await client.ping()
        except Exception as exc:  # noqa: BLE001
            if settings.environment.lower() in {"development", "test"}:
                _backend = _InMemoryRateLimiterBackend()
                return
            close_method = getattr(client, "aclose", None)
            if close_method is not None:
                await close_method()
            raise RuntimeError("Redis is required for auth rate limiting.") from exc

        _backend = _RedisRateLimiterBackend(client)


async def close_rate_limiter() -> None:
    global _backend
    if _backend is None:
        return
    await _backend.close()
    _backend = None


async def reset_rate_limit_state() -> None:
    await init_rate_limiter()
    if _backend is None:
        return
    await _backend.clear(RATE_LIMIT_KEY_PREFIX)


def _client_identifier(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


async def enforce_auth_rate_limit(
    request: Request,
    bucket: str,
    limit: int,
    window_seconds: int,
) -> None:
    await init_rate_limiter()
    if _backend is None or settings.environment.lower() == "development":
        return

    key = f"{RATE_LIMIT_KEY_PREFIX}{bucket}:{_client_identifier(request)}"
    current, _ttl = await _backend.hit(key, limit=limit, window_seconds=window_seconds)
    if current > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many auth requests, please try again later.",
        )


def auth_rate_limit(bucket: str, limit: int, window_seconds: int):
    async def dependency(request: Request) -> None:
        await enforce_auth_rate_limit(
            request=request,
            bucket=bucket,
            limit=limit,
            window_seconds=window_seconds,
        )

    return dependency
