import asyncio
import contextlib
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from urllib.parse import quote_plus

from fastapi import FastAPI
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.infra.projection_schema_ensure import ensure_place_projection_location_geography
from app.infra.projection_seed import run_projection_csv_seed

logger = logging.getLogger(__name__)


def _ping_ml_database() -> None:
    url = (
        f"postgresql+psycopg://{settings.ml_db_username}:"
        f"{quote_plus(settings.ml_db_password)}@{settings.ml_db_host}:"
        f"{settings.ml_db_port}/{settings.ml_db_database}"
    )
    eng = create_engine(url, pool_pre_ping=True, pool_timeout=5)
    with eng.connect() as conn:
        conn.execute(text("SELECT 1"))


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Startup: ML DB ping, CSV seed, RabbitMQ place-projection consumer (optional)."""
    stop = asyncio.Event()
    consumer_task: asyncio.Task[None] | None = None

    if settings.ml_db_database:
        try:
            await asyncio.to_thread(_ping_ml_database)
            logger.info(
                "ML database reachable (database=%s host=%s)",
                settings.ml_db_database,
                settings.ml_db_host,
            )
            await asyncio.to_thread(ensure_place_projection_location_geography)
            await asyncio.to_thread(run_projection_csv_seed)
        except SQLAlchemyError as exc:
            logger.warning(
                "ML database not reachable; API stays up: %s",
                exc,
            )

    if (
        settings.place_projection_consumer_enabled
        and settings.rabbitmq_host.strip()
        and settings.ml_db_database
    ):
        from app.messaging.place_projection_consumer import (
            run_place_projection_consumer,
        )

        consumer_task = asyncio.create_task(
            run_place_projection_consumer(stop),
            name="place_projection_consumer",
        )

    yield

    stop.set()
    if consumer_task:
        with contextlib.suppress(asyncio.CancelledError):
            await consumer_task
