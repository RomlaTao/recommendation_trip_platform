"""Idempotent PostGIS DDL for ML projection (runs on startup, not only docker-init)."""

from __future__ import annotations

import logging
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text

from app.core.config import settings

logger = logging.getLogger(__name__)


def ensure_place_projection_location_geography() -> None:
    """
    Add generated `location` geography + GiST index when missing (survives old ml volumes).
    """
    if not settings.ml_db_database:
        return
    url = (
        f"postgresql+psycopg://{settings.ml_db_username}:"
        f"{quote_plus(settings.ml_db_password)}@{settings.ml_db_host}:"
        f"{settings.ml_db_port}/{settings.ml_db_database}"
    )
    eng = create_engine(url, pool_pre_ping=True, pool_timeout=10)
    stmts = [
        text(
            """
            ALTER TABLE place_features_projection
              ADD COLUMN IF NOT EXISTS location geography(Point, 4326)
              GENERATED ALWAYS AS (
                ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
              ) STORED
            """
        ),
        text(
            """
            CREATE INDEX IF NOT EXISTS idx_place_features_projection_location_geog
              ON place_features_projection USING GIST (location)
            """
        ),
    ]
    try:
        with eng.begin() as conn:
            for stmt in stmts:
                conn.execute(stmt)
        logger.info("ML projection PostGIS geography column/index ensured")
    except Exception as exc:
        logger.warning(
            "Could not ensure PostGIS geography on place_features_projection (use ML_PROJECTION_SPATIAL_MODE=bbox if needed): %s",
            exc,
        )
