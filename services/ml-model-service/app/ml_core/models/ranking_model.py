from __future__ import annotations

from app.ml_core.models.base_model import BaseRanker

# Hardcoded mock "weights" (linear blend on normalised signals) — replace with trained weights later.
_WEIGHT_POPULAR = 0.40
_WEIGHT_TAG_SIMILAR = 0.35
_WEIGHT_DISTANCE = 0.25

_MODEL_VERSION = "v1.0.0-mock-rank"


def _min_max_norm(values: list[float]) -> list[float]:
    if not values:
        return []
    lo, hi = min(values), max(values)
    if hi == lo:
        return [1.0 for _ in values]
    return [(v - lo) / (hi - lo) for v in values]


def _inv_distance_norm(distance_km: list[float]) -> list[float]:
    """Closer → higher value in [0, 1] before min-max."""
    raw = [1.0 / (1.0 + d) for d in distance_km]
    return _min_max_norm(raw)


class MockRankingModel(BaseRanker):
    """
    Mock ranker: popular = rating * review_count (computed upstream per candidate).
    Combines normalised popular, tag_similar, and inverse distance with fixed weights.
    """

    def score(self, *, distance_km: float, popular: float, tag_similar: float) -> float:
        # Single-candidate scoring needs batch norms; RecommendationService batches first.
        raise RuntimeError("Use score_batch on MockRankingModel")

    @staticmethod
    def model_version() -> str:
        return _MODEL_VERSION

    @classmethod
    def score_batch(
        cls,
        rows: list[tuple[float, float, float]],
    ) -> list[float]:
        """
        Each row: (distance_km, popular, tag_similar).
        Returns scores in (0, 1) approximately after sigmoid-style clamp.
        """
        if not rows:
            return []
        dists = [r[0] for r in rows]
        populars = [r[1] for r in rows]
        tags = [r[2] for r in rows]

        n_pop = _min_max_norm(populars)
        n_tag = _min_max_norm(tags)  # already 0..1 often; re-norm for spread
        n_dist = _inv_distance_norm(dists)

        out: list[float] = []
        for p, t, d in zip(n_pop, n_tag, n_dist, strict=True):
            raw = _WEIGHT_POPULAR * p + _WEIGHT_TAG_SIMILAR * t + _WEIGHT_DISTANCE * d
            out.append(round(min(1.0, max(0.0, raw)), 4))
        return out
