SQL in this folder is applied once when the **`ml_postgres_data`** volume is first created (service `postgres-ml` in `docker-compose.yml`).

`01-projection-schema.sql` creates `place_features_projection` (PostGIS + place rows for ML) and `category_projection` (id + name from `dataset/categories.csv` when seeded by the ML app).

After the volume already exists, schema changes here are **not** re-applied; the ML service also runs `CREATE TABLE IF NOT EXISTS category_projection` before CSV seed so older volumes still get the categories table.
