import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTripRouteOverviewSnapshot1760000012000
  implements MigrationInterface
{
  name = 'AddTripRouteOverviewSnapshot1760000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'trips'
        ) THEN
          ALTER TABLE "trips"
          ADD COLUMN IF NOT EXISTS "routeOverview" jsonb;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "trips"
      DROP COLUMN IF EXISTS "routeOverview";
    `);
  }
}
