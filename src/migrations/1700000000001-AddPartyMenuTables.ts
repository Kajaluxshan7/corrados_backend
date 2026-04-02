import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartyMenuTables1700000000001 implements MigrationInterface {
  name = 'AddPartyMenuTables1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "party_menus" (
        "id"             UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "name"           CHARACTER VARYING NOT NULL,
        "menuType"       CHARACTER VARYING NOT NULL DEFAULT 'party',
        "pricePerPerson" NUMERIC(8, 2)     NOT NULL,
        "minimumGuests"  INTEGER,
        "maximumGuests"  INTEGER,
        "description"    TEXT,
        "isActive"       BOOLEAN           NOT NULL DEFAULT true,
        "sortOrder"      INTEGER           NOT NULL DEFAULT 0,
        "createdAt"      TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_party_menus" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "party_menu_sections" (
        "id"          UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "partyMenuId" UUID              NOT NULL,
        "title"       CHARACTER VARYING NOT NULL,
        "sectionType" CHARACTER VARYING NOT NULL DEFAULT 'fixed',
        "instruction" CHARACTER VARYING,
        "sortOrder"   INTEGER           NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_party_menu_sections" PRIMARY KEY ("id"),
        CONSTRAINT "FK_party_menu_sections_partyMenuId"
          FOREIGN KEY ("partyMenuId")
          REFERENCES "party_menus" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "party_menu_section_items" (
        "id"          UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "sectionId"   UUID              NOT NULL,
        "name"        CHARACTER VARYING NOT NULL,
        "description" TEXT,
        "notes"       CHARACTER VARYING,
        "isAvailable" BOOLEAN           NOT NULL DEFAULT true,
        "sortOrder"   INTEGER           NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_party_menu_section_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_party_menu_section_items_sectionId"
          FOREIGN KEY ("sectionId")
          REFERENCES "party_menu_sections" ("id")
          ON DELETE CASCADE
      )
    `);

    // Indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_party_menus_sortOrder"
        ON "party_menus" ("sortOrder" ASC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_party_menu_sections_partyMenuId"
        ON "party_menu_sections" ("partyMenuId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_party_menu_section_items_sectionId"
        ON "party_menu_section_items" ("sectionId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "party_menu_section_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "party_menu_sections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "party_menus"`);
  }
}
