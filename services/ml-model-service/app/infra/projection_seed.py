"""Load `dataset/` CSVs into ML projection tables (localhost / dev convenience)."""

from __future__ import annotations

import csv
import json
import logging
import uuid
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine

from app.core.config import settings

logger = logging.getLogger(__name__)

_PLACE_UPSERT = text(
    """
    INSERT INTO place_features_projection (
      place_id, lat, lng, category_id, average_rating, review_count, status, features, updated_at
    ) VALUES (
      :place_id, :lat, :lng, :category_id, :average_rating, :review_count, :status,
      CAST(:features AS jsonb), NOW()
    )
    ON CONFLICT (place_id) DO UPDATE SET
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      category_id = EXCLUDED.category_id,
      average_rating = EXCLUDED.average_rating,
      review_count = EXCLUDED.review_count,
      status = EXCLUDED.status,
      features = EXCLUDED.features,
      updated_at = NOW()
    """
)

_CATEGORY_UPSERT = text(
    """
    INSERT INTO category_projection (category_id, name, updated_at)
    VALUES (:category_id, :name, NOW())
    ON CONFLICT (category_id) DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = NOW()
    """
)


def _engine() -> Engine:
    url = (
        f"postgresql+psycopg://{settings.ml_db_username}:"
        f"{quote_plus(settings.ml_db_password)}@{settings.ml_db_host}:"
        f"{settings.ml_db_port}/{settings.ml_db_database}"
    )
    return create_engine(url, pool_pre_ping=True, pool_timeout=30)


def _resolve_csv_path(raw: str) -> Path | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    p = Path(raw)
    if not p.is_absolute():
        p = Path.cwd() / p
    return p.resolve()


def _parse_uuid(value: str) -> uuid.UUID | None:
    s = (value or "").strip().strip('"')
    if not s:
        return None
    try:
        return uuid.UUID(s)
    except ValueError:
        return None


def _map_place_status(raw: str) -> str:
    s = (raw or "").strip().lower()
    if s == "published":
        return "APPROVED"
    if s == "rejected":
        return "REJECTED"
    if s:
        return s.upper()[:32]
    return "APPROVED"


def _parse_tag_scores_json(raw: str) -> dict[str, Any] | None:
    s = (raw or "").strip()
    if not s:
        return None
    try:
        out = json.loads(s)
    except json.JSONDecodeError:
        return None
    return out if isinstance(out, dict) else None


def _parse_decimal(raw: str) -> Decimal | None:
    s = (raw or "").strip().strip('"')
    if not s:
        return None
    try:
        return Decimal(s)
    except InvalidOperation:
        return None


def _parse_int(raw: str, default: int = 0) -> int:
    s = (raw or "").strip().strip('"')
    if not s:
        return default
    try:
        return int(float(s))
    except ValueError:
        return default


def _parse_float(raw: str) -> float | None:
    s = (raw or "").strip().strip('"')
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _ensure_category_table(conn: Connection) -> None:
    conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS category_projection (
              category_id UUID PRIMARY KEY NOT NULL,
              name TEXT NOT NULL,
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
    )


def seed_categories_from_csv(conn: Connection, csv_path: Path) -> int:
    if not csv_path.is_file():
        logger.warning("Category CSV not found, skip: %s", csv_path)
        return 0
    _ensure_category_table(conn)
    count = 0
    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = _parse_uuid(row.get("id", "") or "")
            name = (row.get("name") or "").strip()
            if cid is None or not name:
                continue
            conn.execute(_CATEGORY_UPSERT, {"category_id": cid, "name": name})
            count += 1
    return count


def seed_places_from_csv(conn: Connection, csv_path: Path) -> int:
    if not csv_path.is_file():
        logger.warning("Places CSV not found, skip: %s", csv_path)
        return 0
    count = 0
    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if (row.get("deleted_at") or "").strip():
                continue
            pid = _parse_uuid(row.get("id", "") or "")
            if pid is None:
                continue
            lat = _parse_float(row.get("lat", "") or "")
            lng = _parse_float(row.get("lng", "") or "")
            if lat is None or lng is None:
                continue
            cat_raw = row.get("category_id") or ""
            cat_id = _parse_uuid(cat_raw) if cat_raw.strip() else None
            avg = _parse_decimal(row.get("average_rating", "") or "")
            reviews = _parse_int(row.get("review_count", "") or "", 0)
            status = _map_place_status(row.get("status", "") or "")
            features_obj = _parse_tag_scores_json(row.get("tag_scores", "") or "")
            features_json = json.dumps(features_obj, ensure_ascii=False) if features_obj is not None else "null"

            conn.execute(
                _PLACE_UPSERT,
                {
                    "place_id": pid,
                    "lat": lat,
                    "lng": lng,
                    "category_id": cat_id,
                    "average_rating": avg,
                    "review_count": reviews,
                    "status": status,
                    "features": features_json,
                },
            )
            count += 1
    return count


def run_projection_csv_seed() -> None:
    if not settings.ml_seed_on_start or not settings.ml_db_database:
        return

    place_path = _resolve_csv_path(settings.place_csv_path)
    cat_path = _resolve_csv_path(settings.category_for_places_csv_path)
    if place_path is None and cat_path is None:
        logger.info("ML projection seed skipped (no PLACE_CSV_PATH / CATEGORY_FOR_PLACES_CSV_PATH)")
        return

    eng = _engine()
    try:
        with eng.begin() as conn:
            n_cat = seed_categories_from_csv(conn, cat_path) if cat_path else 0
            n_place = seed_places_from_csv(conn, place_path) if place_path else 0
        logger.info(
            "ML projection CSV seed done: %s categories, %s places",
            n_cat,
            n_place,
        )
    except Exception as exc:
        logger.warning("ML projection CSV seed failed (API stays up): %s", exc)
