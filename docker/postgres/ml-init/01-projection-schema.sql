-- ML projection schema (runs on first init of the **postgres-ml** volume only).
-- Default connection is POSTGRES_DB (= ML_DB_DATABASE).

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS place_features_projection (
  place_id UUID PRIMARY KEY NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  category_id UUID,
  average_rating NUMERIC(5, 2),
  review_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
  features JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_place_features_projection_lat_lng
  ON place_features_projection (lat, lng);

CREATE INDEX IF NOT EXISTS idx_place_features_projection_category_id
  ON place_features_projection (category_id)
  WHERE category_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS category_projection (
  category_id UUID PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
