"""Optional Redis client for inference HTTP cache."""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Any = None
_redis_unavailable: bool = False


def get_inference_redis() -> Any:
    """Singleton sync Redis client; None if cache disabled or misconfigured."""
    global _client, _redis_unavailable
    if not settings.ml_inference_cache_enabled or _redis_unavailable:
        return None
    host = (settings.ml_inference_redis_host or "").strip()
    if not host:
        return None
    if _client is not None:
        return _client

    import redis as redis_module

    kwargs: dict[str, Any] = {
        "host": host,
        "port": settings.ml_inference_redis_port,
        "db": settings.ml_inference_redis_db,
        "decode_responses": True,
        "socket_connect_timeout": 2.0,
        "socket_timeout": 2.0,
    }
    pw = settings.ml_inference_redis_password
    if pw:
        kwargs["password"] = pw
    try:
        r = redis_module.Redis(**kwargs)
        r.ping()
        _client = r
    except Exception as exc:
        logger.warning("Inference Redis unavailable, cache disabled for this process: %s", exc)
        _redis_unavailable = True
        _client = None
        return None
    return _client
