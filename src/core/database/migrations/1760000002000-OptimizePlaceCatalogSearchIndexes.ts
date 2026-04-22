import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizePlaceCatalogSearchIndexes1760000002000 implements MigrationInterface {
  name = 'OptimizePlaceCatalogSearchIndexes1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PLACES_SEARCH_GIN" ON "places"
      USING GIN (
        (
          COALESCE("name", '') || ' ' ||
          COALESCE("address", '') || ' ' ||
          COALESCE("description", '')
        ) gin_trgm_ops
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_places_catalog_active_category_updated"
      ON "places" ("categoryId", "updatedAt")
      WHERE "deletedAt" IS NULL AND "status" = 'APPROVED';
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_places_catalog_active_rating_id"
      ON "places" ("averageRating", "id")
      WHERE "deletedAt" IS NULL AND "status" = 'APPROVED';
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_places_catalog_active_name_id"
      ON "places" ("name", "id")
      WHERE "deletedAt" IS NULL AND "status" = 'APPROVED';
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_places_partner_id" ON "places" ("partnerId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_places_category_id" ON "places" ("categoryId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_place_categories_name" ON "place_categories" ("name");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_place_categories_name";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_places_category_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_places_partner_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_places_catalog_active_name_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_places_catalog_active_rating_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_places_catalog_active_category_updated";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_PLACES_SEARCH_GIN";`);
  }
}
