import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselinePlaceCatalogSchema1759999999000 implements MigrationInterface {
  name = 'BaselinePlaceCatalogSchema1759999999000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "partners" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "name" character varying(255) NOT NULL,
        "slug" character varying(100) NOT NULL,
        CONSTRAINT "PK_partners_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_partners_slug" UNIQUE ("slug")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "place_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "parentId" uuid,
        CONSTRAINT "PK_place_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_place_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_place_categories_parent" FOREIGN KEY ("parentId") REFERENCES "place_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "places" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "name" character varying(500) NOT NULL,
        "description" text,
        "address" text NOT NULL,
        "lat" numeric(10,7) NOT NULL,
        "lng" numeric(10,7) NOT NULL,
        "openingHours" jsonb,
        "imageUrls" jsonb,
        "thumbnailUrl" character varying(2048),
        "status" character varying(32) NOT NULL,
        "rejectionReason" text,
        "seedAverageRating" numeric(3,2),
        "seedReviewCount" integer,
        "averageRating" numeric(3,2),
        "reviewCount" integer NOT NULL DEFAULT 0,
        "ratingLastUpdatedAt" TIMESTAMPTZ,
        "googlePlaceId" character varying(255),
        "tagScores" jsonb,
        "dataSource" character varying(32) NOT NULL,
        "importBatchId" character varying(64),
        "deletedReason" text,
        "deletedByUserId" uuid,
        "deletedByRole" character varying(16),
        "partnerId" uuid NOT NULL,
        "categoryId" uuid NOT NULL,
        CONSTRAINT "PK_places_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_places_google_place_id" UNIQUE ("googlePlaceId"),
        CONSTRAINT "FK_places_partner" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_places_category" FOREIGN KEY ("categoryId") REFERENCES "place_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "place_rating_snapshot_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "eventId" uuid NOT NULL,
        "eventType" character varying(64) NOT NULL,
        "status" character varying(32) NOT NULL,
        "placeId" uuid NOT NULL,
        "aggregateId" uuid NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "processedAt" TIMESTAMPTZ,
        "lastError" text,
        "payload" jsonb,
        CONSTRAINT "PK_place_rating_snapshot_events_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_partner_slug" ON "partners" ("slug");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_place_categories_name" ON "place_categories" ("name");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_place_categories_slug" ON "place_categories" ("slug");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_place_categories_parent_id" ON "place_categories" ("parentId");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_place_rating_snapshot_events_event_id" ON "place_rating_snapshot_events" ("eventId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_place_rating_snapshot_events_event_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_place_categories_parent_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_place_categories_slug";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_place_categories_name";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_partner_slug";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "place_rating_snapshot_events";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "places";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "place_categories";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partners";`);
  }
}
