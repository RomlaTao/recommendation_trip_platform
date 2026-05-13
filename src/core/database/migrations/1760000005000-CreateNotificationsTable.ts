import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1760000005000 implements MigrationInterface {
  name = 'CreateNotificationsTable1760000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "sourceEventId" character varying(128) NOT NULL,
        "recipientUserId" uuid NOT NULL,
        "type" character varying(64) NOT NULL,
        "title" character varying(255) NOT NULL,
        "body" text NOT NULL,
        "data" jsonb,
        "isRead" boolean NOT NULL DEFAULT false,
        "readAt" TIMESTAMPTZ,
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_notifications_source_event_id"
      ON "notifications" ("sourceEventId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_recipient_user_id"
      ON "notifications" ("recipientUserId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_is_read"
      ON "notifications" ("isRead");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notifications_is_read";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notifications_recipient_user_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notifications_source_event_id";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications";`);
  }
}
