from __future__ import annotations

import time
from dataclasses import dataclass

from app.ml_core.feature_engineering.preprocessor import haversine_km, tag_similarity
from app.ml_core.models.ranking_model import MockRankingModel
from app.schemas.itinerary_req import ItineraryRecommendationRequest
from app.schemas.itinerary_res import (
    ItineraryRecommendationResponse,
    RecommendationItem,
    RecommendationMetadata,
)


@dataclass(frozen=True)
class _MockPlace:
    location_id: str
    latitude: float
    longitude: float
    rating: float
    review_count: int
    categories: list[str]


# Synthetic catalogue near Vung Tau (mock sync target until RabbitMQ projection exists).
_MOCK_PLACES: tuple[_MockPlace, ...] = (
    _MockPlace("loc_001", 10.3465, 107.0840, 4.6, 120, ["cafe", "brunch"]),
    _MockPlace("loc_045", 10.3480, 107.0900, 4.2, 45, ["restaurant", "seafood"]),
    _MockPlace("loc_089", 10.3520, 107.0780, 4.9, 340, ["cafe", "view"]),
    _MockPlace("loc_102", 10.3380, 107.0950, 4.0, 28, ["restaurant"]),
    _MockPlace("loc_120", 10.3600, 107.0700, 4.7, 210, ["cafe", "dessert"]),
    _MockPlace("loc_201", 10.3300, 107.1100, 3.8, 12, ["bar"]),
    _MockPlace("loc_210", 10.3550, 107.0650, 4.5, 88, ["restaurant", "cafe"]),
    _MockPlace("loc_333", 10.3400, 107.0500, 4.3, 400, ["cafe"]),
    _MockPlace("loc_400", 10.3650, 107.1000, 4.1, 60, ["restaurant", "family"]),
    _MockPlace("loc_501", 10.3200, 107.1200, 3.9, 9, ["street_food"]),
)


class ItineraryRecommendationService:
    """Use case: rank mock candidates using README §5 contract."""

    def recommend(self, payload: ItineraryRecommendationRequest) -> ItineraryRecommendationResponse:
        t0 = time.perf_counter()
        lat0 = payload.trip_context.last_location.latitude
        lon0 = payload.trip_context.last_location.longitude
        radius = payload.constraints.radius_km
        top_k = payload.constraints.top_k
        cats = payload.constraints.category_filter

        candidates: list[tuple[_MockPlace, float, float, float, float]] = []
        for p in _MOCK_PLACES:
            dist = haversine_km(lat0, lon0, p.latitude, p.longitude)
            if dist > radius:
                continue
            popular = p.rating * float(p.review_count)
            tag_sim = tag_similarity(p.categories, cats)
            candidates.append((p, dist, popular, tag_sim))

        scored_rows = [(c[1], c[2], c[3]) for c in candidates]
        scores = MockRankingModel.score_batch(scored_rows) if scored_rows else []

        items: list[tuple[float, RecommendationItem]] = []
        for row, score in zip(candidates, scores, strict=True):
            place, dist_km, _pop, _tag = row
            items.append(
                (
                    score,
                    RecommendationItem(
                        location_id=place.location_id,
                        score=score,
                        distance_km=round(dist_km, 2),
                    ),
                )
            )

        items.sort(key=lambda x: x[0], reverse=True)
        top = [it for _, it in items[:top_k]]

        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        meta = RecommendationMetadata(
            model_version=MockRankingModel.model_version(),
            inference_time_ms=max(1, elapsed_ms),
            candidates_scored=len(candidates),
        )
        return ItineraryRecommendationResponse(recommendations=top, metadata=meta)
