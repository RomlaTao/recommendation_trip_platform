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


settings = Settings()
