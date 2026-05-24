import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexesAndEventTimestamptz1778800795622 implements MigrationInterface {
    name = 'AddIndexesAndEventTimestamptz1778800795622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "menu_items" ALTER COLUMN "allergens" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "menu_items" ALTER COLUMN "dietaryInfo" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "menu_items" ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "specials" ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]::text[]`);
        // Convert in place (preserves existing data) — assumes stored values are UTC
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "displayStartDate" TYPE TIMESTAMP WITH TIME ZONE USING "displayStartDate" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "displayEndDate" TYPE TIMESTAMP WITH TIME ZONE USING "displayEndDate" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "eventStartDate" TYPE TIMESTAMP WITH TIME ZONE USING "eventStartDate" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "eventEndDate" TYPE TIMESTAMP WITH TIME ZONE USING "eventEndDate" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "party_menus" ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "party_menus" ALTER COLUMN "pdfUrls" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`CREATE INDEX "IDX_3dfbf02e5260fbc12f35f7e4a0" ON "menu_categories" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_9954ab46679109fc5d7fd98e57" ON "menu_categories" ("primaryCategoryId") `);
        await queryRunner.query(`CREATE INDEX "IDX_661d5b770c751d5815cb8cfd0d" ON "menu_item_measurements" ("menuItemId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1e6c7ba64e4d5de6e7405bb3a9" ON "menu_item_measurements" ("measurementTypeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d0c613bced28119213eb688a8f" ON "menu_items" ("isAvailable") `);
        await queryRunner.query(`CREATE INDEX "IDX_d56e5ccc298e8bf721f75a7eb9" ON "menu_items" ("categoryId") `);
        await queryRunner.query(`CREATE INDEX "IDX_834d9923713fddc1620618b4a8" ON "specials" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_ae32887cf308485176eae2f086" ON "specials" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_5c751ba5c02239663b81996563" ON "events" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_d95a4b311013d05ea197167c74" ON "events" ("eventStartDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_a5be9dba064b5a2df1d40de97c" ON "events" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_621b952f9eefad22f2f81b1b56" ON "opening_hours" ("dayOfWeek") `);
        await queryRunner.query(`CREATE INDEX "IDX_25a054e14e44de74e3c35bc1f5" ON "stories" ("categoryId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1333b29fe7a916be08c0e1ed83" ON "stories" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_92a5cc3610a9f1c695cd9f4fe3" ON "scheduled_notifications" ("scheduledFor") `);
        await queryRunner.query(`CREATE INDEX "IDX_8699a2c35955d84c795111550e" ON "scheduled_notifications" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c45985989bc600ab871ef1eaf8" ON "announcements" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_b418dacb362d440b45926e53c2" ON "party_menu_section_items" ("sectionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2824a29efb0f874241574a3187" ON "party_menu_sections" ("partyMenuId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c5c3c9557e1fd42b5c97f93de0" ON "party_menus" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_429bc1ac1e155b047e8843eb8f" ON "family_meal_addons" ("familyMealId") `);
        await queryRunner.query(`CREATE INDEX "IDX_da4c8b808c1489881740821df6" ON "family_meals" ("mealType") `);
        await queryRunner.query(`CREATE INDEX "IDX_bf81ab275c6c7adc8a8150fa12" ON "family_meals" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_f727b986d734ea02c09857b076" ON "digital_menu_pdfs" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_3af1ea284028b6a2f8d7a9446a" ON "posters" ("isActive") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3af1ea284028b6a2f8d7a9446a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f727b986d734ea02c09857b076"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf81ab275c6c7adc8a8150fa12"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da4c8b808c1489881740821df6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_429bc1ac1e155b047e8843eb8f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5c3c9557e1fd42b5c97f93de0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2824a29efb0f874241574a3187"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b418dacb362d440b45926e53c2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c45985989bc600ab871ef1eaf8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8699a2c35955d84c795111550e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_92a5cc3610a9f1c695cd9f4fe3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1333b29fe7a916be08c0e1ed83"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_25a054e14e44de74e3c35bc1f5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_621b952f9eefad22f2f81b1b56"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5be9dba064b5a2df1d40de97c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d95a4b311013d05ea197167c74"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5c751ba5c02239663b81996563"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae32887cf308485176eae2f086"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_834d9923713fddc1620618b4a8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d56e5ccc298e8bf721f75a7eb9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d0c613bced28119213eb688a8f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e6c7ba64e4d5de6e7405bb3a9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_661d5b770c751d5815cb8cfd0d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9954ab46679109fc5d7fd98e57"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3dfbf02e5260fbc12f35f7e4a0"`);
        await queryRunner.query(`ALTER TABLE "party_menus" ALTER COLUMN "pdfUrls" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "party_menus" ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "eventEndDate" TYPE TIMESTAMP USING "eventEndDate" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "eventStartDate" TYPE TIMESTAMP USING "eventStartDate" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "displayEndDate" TYPE TIMESTAMP USING "displayEndDate" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "displayStartDate" TYPE TIMESTAMP USING "displayStartDate" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "specials" ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "menu_items" ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "menu_items" ALTER COLUMN "dietaryInfo" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "menu_items" ALTER COLUMN "allergens" SET DEFAULT ARRAY[]`);
    }

}
