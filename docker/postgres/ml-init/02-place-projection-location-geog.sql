-- GiST-friendly geography for radius queries (fresh volumes only; existing volumes
-- get the same DDL from `ensure_place_projection_location_geography` at ML startup).

ALTER TABLE place_features_projection
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326)
  GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_place_features_projection_location_geog
  ON place_features_projection USING GIST (location);
