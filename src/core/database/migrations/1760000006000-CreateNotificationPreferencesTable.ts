import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationPreferencesTable1760000006000 implements MigrationInterface {
  name = 'CreateNotificationPreferencesTable1760000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "userId" uuid NOT NULL,
        "type" character varying(64) NOT NULL,
        "emailEnabled" boolean NOT NULL DEFAULT true,
        "inAppEnabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_notification_preferences_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_preferences_user_id"
      ON "notification_preferences" ("userId");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_notification_preferences_user_type_unique"
      ON "notification_preferences" ("userId", "type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notification_preferences_user_type_unique";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notification_preferences_user_id";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences";`);
  }
}
