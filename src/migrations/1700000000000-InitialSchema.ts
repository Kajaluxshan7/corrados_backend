import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── ENUM TYPES (idempotent) ──────────────────────────────────────────────
    // Use DO blocks so re-running on an existing schema is a no-op.

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'admin');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."specials_type_enum" AS ENUM('daily', 'game_time', 'day_time', 'chef', 'seasonal');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."specials_dayofweek_enum" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."specials_specialcategory_enum" AS ENUM('regular', 'late_night');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."events_type_enum" AS ENUM('live_music', 'sports_viewing', 'trivia_night', 'karaoke', 'private_party', 'special_event');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."opening_hours_dayofweek_enum" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."todos_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."todos_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."scheduled_notifications_type_enum" AS ENUM('special', 'event');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."scheduled_notifications_status_enum" AS ENUM('pending', 'sent', 'failed', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."announcements_type_enum" AS ENUM('general', 'promotion', 'closure', 'menu_update', 'community', 'holiday');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."announcements_priority_enum" AS ENUM('low', 'normal', 'high', 'urgent');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."announcements_status_enum" AS ENUM('draft', 'sending', 'sent', 'failed');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    // ─── TABLES (idempotent — IF NOT EXISTS) ─────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"                           UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "email"                        CHARACTER VARYING NOT NULL,
        "password"                     CHARACTER VARYING NOT NULL,
        "firstName"                    CHARACTER VARYING NOT NULL,
        "lastName"                     CHARACTER VARYING NOT NULL,
        "phone"                        CHARACTER VARYING,
        "profileImage"                 CHARACTER VARYING,
        "role"                         CHARACTER VARYING NOT NULL DEFAULT 'admin',
        "isActive"                     BOOLEAN           NOT NULL DEFAULT true,
        "passwordResetToken"           CHARACTER VARYING,
        "passwordResetTokenExpiry"     TIMESTAMP,
        "isEmailVerified"              BOOLEAN           NOT NULL DEFAULT false,
        "emailVerificationToken"       CHARACTER VARYING,
        "emailVerificationTokenExpiry" TIMESTAMP,
        "createdAt"                    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"                    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastLoginAt"                  TIMESTAMP,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "primary_categories" (
        "id"          UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "name"        CHARACTER VARYING NOT NULL,
        "description" CHARACTER VARYING,
        "imageUrl"    CHARACTER VARYING,
        "sortOrder"   INTEGER           NOT NULL DEFAULT 0,
        "isActive"    BOOLEAN           NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_primary_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "menu_categories" (
        "id"                UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "name"              CHARACTER VARYING NOT NULL,
        "description"       CHARACTER VARYING,
        "imageUrl"          CHARACTER VARYING,
        "sortOrder"         INTEGER           NOT NULL DEFAULT 0,
        "isActive"          BOOLEAN           NOT NULL DEFAULT true,
        "primaryCategoryId" UUID,
        "createdAt"         TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"         TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_menu_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "measurement_types" (
        "id"          UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "name"        CHARACTER VARYING(100) NOT NULL,
        "description" TEXT,
        "isActive"    BOOLEAN           NOT NULL DEFAULT true,
        "sortOrder"   INTEGER           NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UQ_measurement_types_name" UNIQUE ("name"),
        CONSTRAINT "PK_measurement_types" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "menu_items" (
        "id"              UUID             NOT NULL DEFAULT uuid_generate_v4(),
        "name"            CHARACTER VARYING NOT NULL,
        "description"     TEXT             NOT NULL DEFAULT '',
        "price"           NUMERIC(8,2),
        "preparationTime" INTEGER,
        "allergens"       TEXT,
        "dietaryInfo"     TEXT,
        "isAvailable"     BOOLEAN          NOT NULL DEFAULT true,
        "imageUrls"       TEXT[]           NOT NULL DEFAULT ARRAY[]::text[],
        "sortOrder"       INTEGER          NOT NULL DEFAULT 0,
        "categoryId"      UUID,
        "hasMeasurements" BOOLEAN          NOT NULL DEFAULT false,
        "createdAt"       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_menu_items" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "menu_item_measurements" (
        "id"                UUID      NOT NULL DEFAULT uuid_generate_v4(),
        "menuItemId"        UUID      NOT NULL,
        "measurementTypeId" UUID,
        "price"             NUMERIC(8,2) NOT NULL,
        "isAvailable"       BOOLEAN   NOT NULL DEFAULT true,
        "sortOrder"         INTEGER   NOT NULL DEFAULT 0,
        "createdAt"         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_menu_item_measurements" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "specials" (
        "id"               UUID                                    NOT NULL DEFAULT uuid_generate_v4(),
        "title"            CHARACTER VARYING                       NOT NULL,
        "description"      TEXT                                    NOT NULL,
        "type"             "public"."specials_type_enum"           NOT NULL DEFAULT 'daily',
        "dayOfWeek"        "public"."specials_dayofweek_enum",
        "specialCategory"  "public"."specials_specialcategory_enum"         DEFAULT 'regular',
        "displayStartDate" TIMESTAMP WITH TIME ZONE,
        "displayEndDate"   TIMESTAMP WITH TIME ZONE,
        "specialStartDate" TIMESTAMP WITH TIME ZONE,
        "specialEndDate"   TIMESTAMP WITH TIME ZONE,
        "isActive"         BOOLEAN                                 NOT NULL DEFAULT true,
        "imageUrls"        TEXT[]                                  NOT NULL DEFAULT '{}',
        "sortOrder"        INTEGER                                 NOT NULL DEFAULT 0,
        "createdAt"        TIMESTAMP                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"        TIMESTAMP                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_specials" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "events" (
        "id"               UUID                          NOT NULL DEFAULT uuid_generate_v4(),
        "title"            CHARACTER VARYING             NOT NULL,
        "description"      TEXT                          NOT NULL,
        "type"             "public"."events_type_enum"   NOT NULL DEFAULT 'special_event',
        "displayStartDate" TIMESTAMP                     NOT NULL,
        "displayEndDate"   TIMESTAMP                     NOT NULL,
        "eventStartDate"   TIMESTAMP                     NOT NULL,
        "eventEndDate"     TIMESTAMP                     NOT NULL,
        "isActive"         BOOLEAN                       NOT NULL DEFAULT true,
        "imageUrls"        JSON,
        "ticketLink"       CHARACTER VARYING,
        "createdAt"        TIMESTAMP                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"        TIMESTAMP                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "opening_hours" (
        "id"             UUID                                       NOT NULL DEFAULT uuid_generate_v4(),
        "dayOfWeek"      "public"."opening_hours_dayofweek_enum"    NOT NULL,
        "openTime"       TIME,
        "closeTime"      TIME,
        "isClosedNextDay" BOOLEAN                                   NOT NULL DEFAULT false,
        "isOpen"         BOOLEAN                                    NOT NULL DEFAULT true,
        "isActive"       BOOLEAN                                    NOT NULL DEFAULT true,
        "specialNote"    TEXT,
        "createdAt"      TIMESTAMP                                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"      TIMESTAMP                                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_opening_hours" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "todos" (
        "id"           UUID                         NOT NULL DEFAULT uuid_generate_v4(),
        "title"        CHARACTER VARYING            NOT NULL,
        "description"  TEXT,
        "priority"     "public"."todos_priority_enum" NOT NULL DEFAULT 'medium',
        "status"       "public"."todos_status_enum"   NOT NULL DEFAULT 'pending',
        "dueDate"      TIMESTAMP,
        "createdById"  UUID,
        "createdAt"    TIMESTAMP                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt"  TIMESTAMP,
        CONSTRAINT "PK_todos" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscribers" (
        "id"               UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "email"            CHARACTER VARYING NOT NULL,
        "isActive"         BOOLEAN           NOT NULL DEFAULT true,
        "unsubscribeToken" CHARACTER VARYING NOT NULL,
        "subscribedAt"     TIMESTAMP         NOT NULL DEFAULT now(),
        "unsubscribedAt"   TIMESTAMP,
        "updatedAt"        TIMESTAMP         NOT NULL DEFAULT now(),
        "promoCode"        CHARACTER VARYING(8),
        "promoCodeSent"    BOOLEAN           NOT NULL DEFAULT false,
        "promoSentAt"      TIMESTAMP,
        "promoClaimed"     BOOLEAN           NOT NULL DEFAULT false,
        "promoClaimedAt"   TIMESTAMP,
        CONSTRAINT "UQ_subscribers_email"            UNIQUE ("email"),
        CONSTRAINT "UQ_subscribers_unsubscribeToken" UNIQUE ("unsubscribeToken"),
        CONSTRAINT "UQ_subscribers_promoCode"        UNIQUE ("promoCode"),
        CONSTRAINT "PK_subscribers" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "scheduled_notifications" (
        "id"           UUID                                          NOT NULL DEFAULT uuid_generate_v4(),
        "type"         "public"."scheduled_notifications_type_enum"   NOT NULL,
        "referenceId"  UUID                                          NOT NULL,
        "scheduledFor" TIMESTAMP WITH TIME ZONE                      NOT NULL,
        "status"       "public"."scheduled_notifications_status_enum" NOT NULL DEFAULT 'pending',
        "sentAt"       TIMESTAMP WITH TIME ZONE,
        "createdAt"    TIMESTAMP WITH TIME ZONE                      NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scheduled_notifications" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "announcements" (
        "id"             UUID                                   NOT NULL DEFAULT uuid_generate_v4(),
        "title"          CHARACTER VARYING                      NOT NULL,
        "content"        TEXT                                   NOT NULL,
        "type"           "public"."announcements_type_enum"     NOT NULL DEFAULT 'general',
        "priority"       "public"."announcements_priority_enum" NOT NULL DEFAULT 'normal',
        "status"         "public"."announcements_status_enum"   NOT NULL DEFAULT 'draft',
        "recipientCount" INTEGER                                NOT NULL DEFAULT 0,
        "sentAt"         TIMESTAMP,
        "ctaText"        CHARACTER VARYING,
        "ctaUrl"         CHARACTER VARYING,
        "createdAt"      TIMESTAMP                              NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP                              NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcements" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "story_categories" (
        "id"          UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "name"        CHARACTER VARYING NOT NULL,
        "description" TEXT,
        "isActive"    BOOLEAN           NOT NULL DEFAULT true,
        "sortOrder"   INTEGER           NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_story_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stories" (
        "id"         UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "categoryId" UUID              NOT NULL,
        "imageUrls"  TEXT              NOT NULL DEFAULT '',
        "isActive"   BOOLEAN           NOT NULL DEFAULT true,
        "sortOrder"  INTEGER           NOT NULL DEFAULT 0,
        "createdAt"  TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stories" PRIMARY KEY ("id")
      )
    `);

    // ─── FOREIGN KEY CONSTRAINTS (idempotent) ────────────────────────────────
    // Using DO blocks to skip if the constraint already exists.

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "menu_categories"
          ADD CONSTRAINT "FK_menu_categories_primaryCategoryId"
            FOREIGN KEY ("primaryCategoryId")
            REFERENCES "primary_categories" ("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "menu_items"
          ADD CONSTRAINT "FK_menu_items_categoryId"
            FOREIGN KEY ("categoryId")
            REFERENCES "menu_categories" ("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "menu_item_measurements"
          ADD CONSTRAINT "FK_menu_item_measurements_menuItemId"
            FOREIGN KEY ("menuItemId")
            REFERENCES "menu_items" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "menu_item_measurements"
          ADD CONSTRAINT "FK_menu_item_measurements_measurementTypeId"
            FOREIGN KEY ("measurementTypeId")
            REFERENCES "measurement_types" ("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "todos"
          ADD CONSTRAINT "FK_todos_createdById"
            FOREIGN KEY ("createdById")
            REFERENCES "users" ("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "stories"
          ADD CONSTRAINT "FK_stories_categoryId"
            FOREIGN KEY ("categoryId")
            REFERENCES "story_categories" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ─── DROP FOREIGN KEYS ────────────────────────────────────────────────────

    await queryRunner.query(`ALTER TABLE "stories" DROP CONSTRAINT "FK_stories_categoryId"`);
    await queryRunner.query(`ALTER TABLE "todos" DROP CONSTRAINT "FK_todos_createdById"`);
    await queryRunner.query(`ALTER TABLE "menu_item_measurements" DROP CONSTRAINT "FK_menu_item_measurements_measurementTypeId"`);
    await queryRunner.query(`ALTER TABLE "menu_item_measurements" DROP CONSTRAINT "FK_menu_item_measurements_menuItemId"`);
    await queryRunner.query(`ALTER TABLE "menu_items" DROP CONSTRAINT "FK_menu_items_categoryId"`);
    await queryRunner.query(`ALTER TABLE "menu_categories" DROP CONSTRAINT "FK_menu_categories_primaryCategoryId"`);

    // ─── DROP TABLES ──────────────────────────────────────────────────────────

    await queryRunner.query(`DROP TABLE "stories"`);
    await queryRunner.query(`DROP TABLE "story_categories"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(`DROP TABLE "scheduled_notifications"`);
    await queryRunner.query(`DROP TABLE "subscribers"`);
    await queryRunner.query(`DROP TABLE "todos"`);
    await queryRunner.query(`DROP TABLE "opening_hours"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TABLE "specials"`);
    await queryRunner.query(`DROP TABLE "menu_item_measurements"`);
    await queryRunner.query(`DROP TABLE "menu_items"`);
    await queryRunner.query(`DROP TABLE "measurement_types"`);
    await queryRunner.query(`DROP TABLE "menu_categories"`);
    await queryRunner.query(`DROP TABLE "primary_categories"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // ─── DROP ENUM TYPES ──────────────────────────────────────────────────────

    await queryRunner.query(`DROP TYPE "public"."announcements_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."announcements_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."announcements_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."scheduled_notifications_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."scheduled_notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."todos_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."todos_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."opening_hours_dayofweek_enum"`);
    await queryRunner.query(`DROP TYPE "public"."events_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."specials_specialcategory_enum"`);
    await queryRunner.query(`DROP TYPE "public"."specials_dayofweek_enum"`);
    await queryRunner.query(`DROP TYPE "public"."specials_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
