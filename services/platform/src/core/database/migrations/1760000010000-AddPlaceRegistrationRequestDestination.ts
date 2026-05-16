import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlaceRegistrationRequestDestination1760000010000 implements MigrationInterface {
  name = 'AddPlaceRegistrationRequestDestination1760000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "place_registration_requests"
      ADD COLUMN IF NOT EXISTS "destinationId" uuid;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "place_registration_requests"
        ADD CONSTRAINT "FK_place_registration_requests_destination"
        FOREIGN KEY ("destinationId") REFERENCES "destinations"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "place_registration_requests"
      DROP CONSTRAINT IF EXISTS "FK_place_registration_requests_destination";
    `);
    await queryRunner.query(`
      ALTER TABLE "place_registration_requests"
      DROP COLUMN IF EXISTS "destinationId";
    `);
  }
}
