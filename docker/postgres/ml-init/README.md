SQL in this folder is applied once when the **`ml_postgres_data`** volume is first created (service `postgres-ml` in `docker-compose.yml`).

`01-projection-schema.sql` creates `place_features_projection` (PostGIS + place rows for ML) and `category_projection` (id + name from `dataset/categories.csv` when seeded by the ML app).

`02-place-projection-location-geog.sql` adds the generated **`location geography`** column and **GiST** index for `ST_DWithin` radius queries. The ML app also runs the same DDL at startup (`projection_schema_ensure`) so **existing** volumes pick it up without recreating the volume.

After the volume already exists, schema changes here are **not** re-applied automatically except via the ML service startup DDL; the ML service also runs `CREATE TABLE IF NOT EXISTS category_projection` before CSV seed so older volumes still get the categories table.
