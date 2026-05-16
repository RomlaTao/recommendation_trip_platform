"""Load ranking candidates from ML Postgres projection (README §3.3)."""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import settings
from app.ml_core.feature_engineering.preprocessor import haversine_km

logger = logging.getLogger(__name__)

# ~111 km per degree latitude; longitude shrinks with cos(latitude)
_DEG_LAT_PER_KM = 1.0 / 111.0


def _bounding_box(lat0: float, lon0: float, radius_km: float) -> tuple[float, float, float, float]:
    dlat = radius_km * _DEG_LAT_PER_KM
    cos_lat = max(0.2, abs(math.cos(math.radians(lat0))))
    dlon = radius_km * _DEG_LAT_PER_KM / cos_lat
    return lat0 - dlat, lat0 + dlat, lon0 - dlon, lon0 + dlon


@dataclass(frozen=True)
class ProjectionCandidate:
    place_id: str
    latitude: float
    longitude: float
    distance_km: float
    rating: float
    review_count: int
    tag_sources: list[str]


_FETCH_POSTGIS = text(
    """
    SELECT
      p.place_id::text AS place_id,
      p.lat::float8 AS lat,
      p.lng::float8 AS lng,
      (ST_Distance(p.location, r.ref_pt) / 1000.0)::float8 AS distance_km,
      COALESCE(p.average_rating::float8, 0.0) AS average_rating,
      p.review_count::int AS review_count,
      p.features AS features,
      c.name AS category_name
    FROM place_features_projection p
    LEFT JOIN category_projection c ON c.category_id = p.category_id
    CROSS JOIN LATERAL (
      SELECT ST_SetSRID(ST_MakePoint(:lon0, :lat0), 4326)::geography AS ref_pt
    ) r
    WHERE p.status = 'APPROVED'
      AND p.location IS NOT NULL
      AND ST_DWithin(p.location, r.ref_pt, :radius_m)
    """
)

_FETCH_BBOX = text(
    """
    SELECT
      p.place_id::text AS place_id,
      p.lat::float8 AS lat,
      p.lng::float8 AS lng,
      COALESCE(p.average_rating::float8, 0.0) AS average_rating,
      p.review_count::int AS review_count,
      p.features AS features,
      c.name AS category_name
    FROM place_features_projection p
    LEFT JOIN category_projection c ON c.category_id = p.category_id
    WHERE p.status = 'APPROVED'
      AND p.lat BETWEEN :min_lat AND :max_lat
      AND p.lng BETWEEN :min_lon AND :max_lon
    """
)


def _engine() -> Engine | None:
    if not settings.ml_db_database:
        return None
    url = (
        f"postgresql+psycopg://{settings.ml_db_username}:"
        f"{quote_plus(settings.ml_db_password)}@{settings.ml_db_host}:"
        f"{settings.ml_db_port}/{settings.ml_db_database}"
    )
    return create_engine(url, pool_pre_ping=True, pool_timeout=5)


def _tag_sources_from_row(row: dict) -> list[str]:
    features = row.get("features") or {}
    tag_sources: list[str] = []
    cat = row.get("category_name")
    if isinstance(cat, str) and cat.strip():
        tag_sources.append(cat.strip().lower())
    if isinstance(features, dict):
        for k, v in features.items():
            if isinstance(v, (int, float)) and float(v) >= 0.25 and isinstance(k, str):
                tag_sources.append(k.strip().lower())
    return list(dict.fromkeys(tag_sources))


def _rows_to_candidates(
    rows: list,
    lat0: float,
    lon0: float,
    radius_km: float,
    exclude_place_ids: set[str],
    *,
    distance_from_row: bool,
) -> list[ProjectionCandidate]:
    out: list[ProjectionCandidate] = []
    for row in rows:
        m = dict(row)
        pid = str(m["place_id"])
        if pid.lower() in exclude_place_ids:
            continue
        lat = float(m["lat"])
        lng = float(m["lng"])
        if distance_from_row and m.get("distance_km") is not None:
            dist = float(m["distance_km"])
        else:
            dist = haversine_km(lat0, lon0, lat, lng)
            if dist > radius_km:
                continue

        tag_sources = _tag_sources_from_row(m)
        rating = float(m["average_rating"] or 0.0)
        rc = int(m["review_count"] or 0)
        out.append(
            ProjectionCandidate(
                place_id=pid,
                latitude=lat,
                longitude=lng,
                distance_km=dist,
                rating=rating,
                review_count=rc,
                tag_sources=tag_sources,
            ),
        )
    return out


def fetch_projection_candidates(
    lat0: float,
    lon0: float,
    radius_km: float,
    exclude_place_ids: set[str],
) -> list[ProjectionCandidate]:
    eng = _engine()
    if eng is None:
        return []

    mode = (settings.ml_projection_spatial_mode or "postgis").strip().lower()
    radius_m = float(radius_km) * 1000.0

    try:
        with eng.connect() as conn:
            if mode == "postgis":
                rows = conn.execute(
                    _FETCH_POSTGIS,
                    {"lon0": lon0, "lat0": lat0, "radius_m": radius_m},
                ).mappings().all()
                return _rows_to_candidates(
                    rows,
                    lat0,
                    lon0,
                    radius_km,
                    exclude_place_ids,
                    distance_from_row=True,
                )

            min_lat, max_lat, min_lon, max_lon = _bounding_box(lat0, lon0, radius_km)
            rows = conn.execute(
                _FETCH_BBOX,
                {
                    "min_lat": min_lat,
                    "max_lat": max_lat,
                    "min_lon": min_lon,
                    "max_lon": max_lon,
                },
            ).mappings().all()
            return _rows_to_candidates(
                rows,
                lat0,
                lon0,
                radius_km,
                exclude_place_ids,
                distance_from_row=False,
            )
    except Exception as exc:
        if mode == "postgis":
            logger.warning(
                "PostGIS candidate query failed, retrying with bbox mode: %s",
                exc,
            )
            try:
                with eng.connect() as conn:
                    min_lat, max_lat, min_lon, max_lon = _bounding_box(lat0, lon0, radius_km)
                    rows = conn.execute(
                        _FETCH_BBOX,
                        {
                            "min_lat": min_lat,
                            "max_lat": max_lat,
                            "min_lon": min_lon,
                            "max_lon": max_lon,
                        },
                    ).mappings().all()
                    return _rows_to_candidates(
                        rows,
                        lat0,
                        lon0,
                        radius_km,
                        exclude_place_ids,
                        distance_from_row=False,
                    )
            except Exception as exc2:
                logger.warning("projection candidate query failed: %s", exc2)
                return []
        logger.warning("projection candidate query failed: %s", exc)
        return []
