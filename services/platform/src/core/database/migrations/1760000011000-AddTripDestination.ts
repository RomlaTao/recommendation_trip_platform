import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTripDestination1760000011000 implements MigrationInterface {
  name = 'AddTripDestination1760000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'trips'
        ) THEN
          ALTER TABLE "trips"
          ADD COLUMN IF NOT EXISTS "destinationId" uuid;

          UPDATE "trips" t
          SET "destinationId" = (
            SELECT d."id" FROM "destinations" d
            WHERE d."deletedAt" IS NULL
            ORDER BY d."createdAt" ASC
            LIMIT 1
          )
          WHERE t."destinationId" IS NULL
            AND EXISTS (SELECT 1 FROM "destinations" d WHERE d."deletedAt" IS NULL);

          ALTER TABLE "trips"
          ALTER COLUMN "destinationId" SET NOT NULL;

          CREATE INDEX IF NOT EXISTS "IDX_trips_destination_id"
          ON "trips" ("destinationId");

          BEGIN
            ALTER TABLE "trips"
            ADD CONSTRAINT "FK_trips_destination"
            FOREIGN KEY ("destinationId") REFERENCES "destinations"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION;
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "trips"
      DROP CONSTRAINT IF EXISTS "FK_trips_destination";
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_trips_destination_id";`,
    );
    await queryRunner.query(`
      ALTER TABLE "trips"
      DROP COLUMN IF EXISTS "destinationId";
    `);
  }
}
