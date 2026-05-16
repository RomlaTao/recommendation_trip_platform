"""Redis cache for itinerary HTTP inference (normalized key + TTL)."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

from pydantic import ValidationError

from app.core.config import settings
from app.ml_core.models.ranking_model import MockRankingModel
from app.schemas.itinerary_req import ItineraryRecommendationRequest
from app.schemas.itinerary_res import ItineraryRecommendationResponse

logger = logging.getLogger(__name__)


def _normalized_payload(payload: ItineraryRecommendationRequest) -> dict[str, Any]:
    """Stable dict for hashing (README §3.2): grid coords, sorted lists, ranker version."""
    loc = payload.day_context.last_location
    return {
        "mv": MockRankingModel.model_version(),
        "user_id": payload.user_context.user_id.strip(),
        "region_id": payload.trip_context.region_id.strip(),
        "current_time": payload.trip_context.current_time.strip(),
        "day_id": payload.day_context.day_id.strip(),
        "lat": round(loc.latitude, 5),
        "lon": round(loc.longitude, 5),
        "draft_route_ids": sorted(
            x.strip().lower() for x in payload.day_context.draft_route_ids if x.strip()
        ),
        "radius_km": round(payload.constraints.radius_km, 4),
        "top_k": payload.constraints.top_k,
        "category_filter": sorted(
            x.strip().lower() for x in payload.constraints.category_filter if x.strip()
        ),
    }


def itinerary_inference_cache_key(payload: ItineraryRecommendationRequest) -> str:
    body = json.dumps(_normalized_payload(payload), sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    return f"{settings.ml_inference_cache_key_prefix}:{digest}"


def parse_cached_itinerary_response(raw: str) -> ItineraryRecommendationResponse | None:
    try:
        return ItineraryRecommendationResponse.model_validate_json(raw)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.debug("inference cache value invalid: %s", exc)
        return None
