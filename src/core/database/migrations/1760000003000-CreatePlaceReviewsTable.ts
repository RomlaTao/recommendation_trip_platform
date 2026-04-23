import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlaceReviewsTable1760000003000 implements MigrationInterface {
  name = 'CreatePlaceReviewsTable1760000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "place_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "placeId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "rating" smallint NOT NULL,
        "comment" text,
        "imageUrls" jsonb,
        CONSTRAINT "PK_place_reviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_place_reviews_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_place_reviews_place_id" ON "place_reviews" ("placeId");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_place_reviews_user_place_unique"
      ON "place_reviews" ("userId", "placeId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_place_reviews_user_place_unique";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_place_reviews_place_id";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "place_reviews";`);
  }
}
