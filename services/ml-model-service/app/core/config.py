from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ml-model-service"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8001

    # ML Postgres (compose: service `postgres-ml`, host port often 5433 on localhost)
    ml_db_host: str = "127.0.0.1"
    ml_db_port: int = 5433
    ml_db_username: str = "postgres"
    ml_db_password: str = "postgres"
    ml_db_database: str = "recommendation_trip_ml"

    # Seed ML DB from repo `dataset/` CSVs (paths relative to process cwd unless absolute).
    ml_seed_on_start: bool = True
    place_csv_path: str = ""
    category_for_places_csv_path: str = ""

    rabbitmq_host: str = ""
    rabbitmq_port: int = 5672
    rabbitmq_user: str = "guest"
    rabbitmq_password: str = "guest"
    place_ml_rabbitmq_exchange: str = "place.events"
    place_ml_rabbitmq_routing_key: str = "place.projection.v1"
    place_projection_consumer_enabled: bool = True

    # Candidate query: postgis (ST_DWithin on geography + GiST) or bbox (legacy bbox + Haversine in Python).
    ml_projection_spatial_mode: str = "postgis"

    # Inference HTTP cache (Redis). Compose: set ML_INFERENCE_CACHE_ENABLED=true and ML_INFERENCE_REDIS_HOST=redis.
    ml_inference_cache_enabled: bool = False
    ml_inference_redis_host: str = ""
    ml_inference_redis_port: int = 6379
    ml_inference_redis_password: str = ""
    ml_inference_redis_db: int = 0
    ml_inference_cache_ttl_seconds: int = 900
    ml_inference_cache_key_prefix: str = "ml:itinerary:v1"


settings = Settings()
