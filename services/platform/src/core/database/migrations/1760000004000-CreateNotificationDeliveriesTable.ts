import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationDeliveriesTable1760000004000 implements MigrationInterface {
  name = 'CreateNotificationDeliveriesTable1760000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_deliveries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "sourceEventId" character varying(128) NOT NULL,
        "channel" character varying(32) NOT NULL,
        "templateCode" character varying(64) NOT NULL,
        "recipient" character varying(255) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" character varying(16) NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "lastError" text,
        "sentAt" TIMESTAMPTZ,
        CONSTRAINT "PK_notification_deliveries_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_notification_deliveries_source_event"
      ON "notification_deliveries" ("sourceEventId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_deliveries_recipient"
      ON "notification_deliveries" ("recipient");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_deliveries_status"
      ON "notification_deliveries" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notification_deliveries_status";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notification_deliveries_recipient";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notification_deliveries_source_event";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_deliveries";`);
  }
}
