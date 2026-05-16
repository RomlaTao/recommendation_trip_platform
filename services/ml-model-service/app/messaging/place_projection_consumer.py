"""RabbitMQ consumer: platform place projection → ML Postgres upsert (README §7.2)."""

from __future__ import annotations

import asyncio
import json
import logging
from decimal import Decimal
from typing import Any
from urllib.parse import quote_plus

import aio_pika
from aio_pika.abc import AbstractIncomingMessage
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import settings

logger = logging.getLogger(__name__)

_DELETE_SQL = text(
    'DELETE FROM place_features_projection WHERE place_id = CAST(:place_id AS uuid)'
)

_UPSERT_SQL = text(
    """
    INSERT INTO place_features_projection (
      place_id, lat, lng, category_id, average_rating, review_count, status, features, updated_at
    ) VALUES (
      CAST(:place_id AS uuid), :lat, :lng, CAST(:category_id AS uuid), :average_rating,
      :review_count, :status, CAST(:features AS jsonb), NOW()
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


def _engine() -> Engine:
    url = (
        f"postgresql+psycopg://{settings.ml_db_username}:"
        f"{quote_plus(settings.ml_db_password)}@{settings.ml_db_host}:"
        f"{settings.ml_db_port}/{settings.ml_db_database}"
    )
    return create_engine(url, pool_pre_ping=True)


def _apply_place_payload(engine: Engine, body: dict[str, Any]) -> None:
    place = body.get("place") or {}
    place_id = place.get("id")
    if not place_id:
        logger.warning("place_projection message missing place.id; ack skip")
        return

    deleted_at = place.get("deletedAt")
    if deleted_at:
        with engine.begin() as conn:
            conn.execute(_DELETE_SQL, {"place_id": str(place_id)})
        return

    lat = float(place.get("lat") or 0)
    lng = float(place.get("lng") or 0)
    category_id = place.get("categoryId")
    avg = place.get("averageRating")
    if avg is not None and avg != "":
        avg_param: str | None = str(avg)
    else:
        avg_param = None
    review_count = int(place.get("reviewCount") or 0)
    catalog = str(place.get("catalogStatus") or "DRAFT").upper()[:32]
    tag_scores = place.get("tagScores")
    features_json = json.dumps(tag_scores) if tag_scores is not None else "null"

    with engine.begin() as conn:
        conn.execute(
            _UPSERT_SQL,
            {
                "place_id": str(place_id),
                "lat": lat,
                "lng": lng,
                "category_id": str(category_id) if category_id else None,
                "average_rating": Decimal(avg_param) if avg_param else None,
                "review_count": review_count,
                "status": catalog,
                "features": features_json,
            },
        )


async def run_place_projection_consumer(stop: asyncio.Event) -> None:
    if not settings.place_projection_consumer_enabled:
        logger.info("Place projection RabbitMQ consumer disabled.")
        return
    if not settings.rabbitmq_host.strip():
        logger.info("RabbitMQ host unset; projection consumer not started.")
        return
    if not settings.ml_db_database:
        logger.info("ML database unset; projection consumer not started.")
        return

    engine = _engine()
    amqp_url = (
        f"amqp://{quote_plus(settings.rabbitmq_user)}:"
        f"{quote_plus(settings.rabbitmq_password)}@{settings.rabbitmq_host}:"
        f"{settings.rabbitmq_port}/"
    )

    connection = await aio_pika.connect_robust(amqp_url)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=10)
    exchange = await channel.declare_exchange(
        settings.place_ml_rabbitmq_exchange,
        aio_pika.ExchangeType.TOPIC,
        durable=True,
    )
    queue = await channel.declare_queue("place.projection.ml", durable=True)
    await queue.bind(exchange, routing_key=settings.place_ml_rabbitmq_routing_key)

    logger.info(
        "Place projection consumer bound exchange=%s rk=%s",
        settings.place_ml_rabbitmq_exchange,
        settings.place_ml_rabbitmq_routing_key,
    )

    async def on_message(message: AbstractIncomingMessage) -> None:
        async with message.process():
            try:
                raw = message.body.decode("utf-8")
                body = json.loads(raw)
                await asyncio.to_thread(_apply_place_payload, engine, body)
            except json.JSONDecodeError:
                logger.warning("place_projection invalid JSON; message discarded")

    await queue.consume(on_message)

    try:
        await stop.wait()
    finally:
        await connection.close()
        engine.dispose()
