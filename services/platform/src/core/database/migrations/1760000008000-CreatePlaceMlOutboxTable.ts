import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlaceMlOutboxTable1760000008000 implements MigrationInterface {
  name = 'CreatePlaceMlOutboxTable1760000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "place_ml_outbox" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "aggregateType" character varying(64) NOT NULL,
        "aggregateId" uuid NOT NULL,
        "eventId" uuid NOT NULL,
        "eventType" character varying(128) NOT NULL,
        "routingKey" character varying(256) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'PENDING',
        "publishedAt" TIMESTAMPTZ,
        "lastError" text,
        "attemptCount" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_place_ml_outbox_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_place_ml_outbox_event_id" UNIQUE ("eventId")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_place_ml_outbox_status_created_at"
      ON "place_ml_outbox" ("status", "createdAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_place_ml_outbox_status_created_at";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "place_ml_outbox";`);
  }
}
