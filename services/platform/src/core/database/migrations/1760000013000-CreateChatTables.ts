import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatTables1760000013000 implements MigrationInterface {
  name = 'CreateChatTables1760000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "type" character varying(32) NOT NULL,
        "directKey" character varying(80),
        CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_conversations_direct_key"
      ON "conversations" ("directKey")
      WHERE "directKey" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversation_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "conversationId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_conversation_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_conversation_members_conversation"
          FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_conversation_members_conversation_user"
      ON "conversation_members" ("conversationId", "userId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_members_user_id"
      ON "conversation_members" ("userId");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "conversationId" uuid NOT NULL,
        "senderUserId" uuid NOT NULL,
        "body" text NOT NULL,
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_conversation"
          FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_conversation_id_created_at"
      ON "messages" ("conversationId", "createdAt" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_messages_conversation_id_created_at";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "messages";`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_conversation_members_user_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_conversation_members_conversation_user";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "conversation_members";`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_conversations_direct_key";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations";`);
  }
}
