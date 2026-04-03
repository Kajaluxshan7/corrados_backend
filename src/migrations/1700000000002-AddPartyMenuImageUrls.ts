import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartyMenuImageUrls1700000000002 implements MigrationInterface {
  name = 'AddPartyMenuImageUrls1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "party_menus"
      ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::text[]
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "party_menus" DROP COLUMN IF EXISTS "imageUrls"
    `);
  }
}
