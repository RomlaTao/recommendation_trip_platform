from __future__ import annotations

import time

from app.core.config import settings
from app.infra.inference_cache import (
    itinerary_inference_cache_key,
    parse_cached_itinerary_response,
)
from app.infra.projection_candidates import fetch_projection_candidates
from app.infra.redis_client import get_inference_redis
from app.ml_core.feature_engineering.preprocessor import tag_similarity
from app.ml_core.models.ranking_model import MockRankingModel
from app.schemas.itinerary_req import ItineraryRecommendationRequest
from app.schemas.itinerary_res import (
    ItineraryRecommendationResponse,
    RecommendationItem,
    RecommendationMetadata,
)


class ItineraryRecommendationService:
    """Rank candidates from ML DB projection using README §5 contract."""

    def recommend(self, payload: ItineraryRecommendationRequest) -> ItineraryRecommendationResponse:
        cache_key = itinerary_inference_cache_key(payload)
        r = get_inference_redis()
        if r is not None:
            try:
                cached = r.get(cache_key)
                if cached:
                    parsed = parse_cached_itinerary_response(cached)
                    if parsed is not None:
                        return parsed
            except Exception:
                pass

        t0 = time.perf_counter()
        lat0 = payload.day_context.last_location.latitude
        lon0 = payload.day_context.last_location.longitude
        radius = payload.constraints.radius_km
        top_k = payload.constraints.top_k
        cats = payload.constraints.category_filter

        exclude = {x.strip().lower() for x in payload.day_context.draft_route_ids if x}
        places = fetch_projection_candidates(lat0, lon0, radius, exclude)

        scored_rows: list[tuple[float, float, float]] = []
        for p in places:
            popular = p.rating * float(p.review_count)
            tag_sim = tag_similarity(p.tag_sources, cats)
            scored_rows.append((p.distance_km, popular, tag_sim))

        scores = MockRankingModel.score_batch(scored_rows) if scored_rows else []

        items: list[tuple[float, RecommendationItem]] = []
        for place, score in zip(places, scores, strict=True):
            items.append(
                (
                    score,
                    RecommendationItem(
                        location_id=place.place_id,
                        score=score,
                        distance_km=round(place.distance_km, 2),
                    ),
                ),
            )

        items.sort(key=lambda x: x[0], reverse=True)
        top = [it for _, it in items[:top_k]]

        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        meta = RecommendationMetadata(
            model_version=MockRankingModel.model_version(),
            inference_time_ms=max(1, elapsed_ms),
            candidates_scored=len(places),
        )
        out = ItineraryRecommendationResponse(recommendations=top, metadata=meta)

        if r is not None:
            try:
                ttl = max(1, int(settings.ml_inference_cache_ttl_seconds))
                r.set(cache_key, out.model_dump_json(), ex=ttl)
            except Exception:
                pass

        return out
