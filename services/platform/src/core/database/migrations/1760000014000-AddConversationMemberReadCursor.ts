import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationMemberReadCursor1760000014000
  implements MigrationInterface
{
  name = 'AddConversationMemberReadCursor1760000014000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "conversation_members"
        ADD COLUMN IF NOT EXISTS "lastReadMessageId" uuid NULL,
        ADD COLUMN IF NOT EXISTS "lastReadAt" TIMESTAMPTZ NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "conversation_members"
        ADD CONSTRAINT "FK_conversation_members_last_read_message"
        FOREIGN KEY ("lastReadMessageId") REFERENCES "messages"("id")
        ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "conversation_members"
        DROP CONSTRAINT IF EXISTS "FK_conversation_members_last_read_message";
    `);

    await queryRunner.query(`
      ALTER TABLE "conversation_members"
        DROP COLUMN IF EXISTS "lastReadMessageId",
        DROP COLUMN IF EXISTS "lastReadAt";
    `);
  }
}
