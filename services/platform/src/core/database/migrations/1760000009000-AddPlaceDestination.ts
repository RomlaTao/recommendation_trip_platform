import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlaceDestination1760000009000 implements MigrationInterface {
  name = 'AddPlaceDestination1760000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "destinations" (
        "id" uuid NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "slug" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        CONSTRAINT "PK_destinations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_destinations_slug" UNIQUE ("slug")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_destinations_slug"
      ON "destinations" ("slug");
    `);

    await queryRunner.query(`
      ALTER TABLE "places"
      ADD COLUMN IF NOT EXISTS "destinationId" uuid;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_places_destination_id"
      ON "places" ("destinationId");
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "places"
        ADD CONSTRAINT "FK_places_destination"
        FOREIGN KEY ("destinationId") REFERENCES "destinations"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "places"
      DROP CONSTRAINT IF EXISTS "FK_places_destination";
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_places_destination_id";`,
    );
    await queryRunner.query(`
      ALTER TABLE "places"
      DROP COLUMN IF EXISTS "destinationId";
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_destinations_slug";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "destinations";`);
  }
}
