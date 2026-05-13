import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlaceRegistrationAndPartnerOwnerLink1760000007000 implements MigrationInterface {
  name = 'CreatePlaceRegistrationAndPartnerOwnerLink1760000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "partners"
      ADD COLUMN IF NOT EXISTS "ownerUserId" uuid;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_partners_owner_user'
        ) THEN
          ALTER TABLE "partners"
          ADD CONSTRAINT "FK_partners_owner_user" FOREIGN KEY ("ownerUserId")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_partners_owner_user_id" ON "partners" ("ownerUserId") WHERE "ownerUserId" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "place_registration_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "requesterUserId" uuid NOT NULL,
        "status" character varying(32) NOT NULL,
        "name" character varying(500) NOT NULL,
        "description" text,
        "address" text NOT NULL,
        "lat" numeric(10,7) NOT NULL,
        "lng" numeric(10,7) NOT NULL,
        "categoryId" uuid NOT NULL,
        "partnerId" uuid NOT NULL,
        "imageUrls" jsonb,
        "thumbnailUrl" character varying(2048),
        "reviewedByUserId" uuid,
        "reviewedAt" TIMESTAMPTZ,
        "rejectionReason" text,
        "approvedPlaceId" uuid,
        CONSTRAINT "PK_place_registration_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_place_registration_requests_requester_user" FOREIGN KEY ("requesterUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_place_registration_requests_reviewed_user" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_place_registration_requests_category" FOREIGN KEY ("categoryId") REFERENCES "place_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_place_registration_requests_partner" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_place_registration_requests_approved_place" FOREIGN KEY ("approvedPlaceId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_place_registration_requests_requester_user_id" ON "place_registration_requests" ("requesterUserId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_place_registration_requests_status_created_at" ON "place_registration_requests" ("status", "createdAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_place_registration_requests_status_created_at";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_place_registration_requests_requester_user_id";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "place_registration_requests";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_partners_owner_user_id";`,
    );
    await queryRunner.query(
      `ALTER TABLE "partners" DROP CONSTRAINT IF EXISTS "FK_partners_owner_user";`,
    );
    await queryRunner.query(
      `ALTER TABLE "partners" DROP COLUMN IF EXISTS "ownerUserId";`,
    );
  }
}
