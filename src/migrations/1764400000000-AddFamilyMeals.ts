import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFamilyMeals1764400000000 implements MigrationInterface {
  name = 'AddFamilyMeals1764400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Create family_meals table ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "family_meals" (
        "id"          uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "name"        varchar(255) NOT NULL,
        "description" text,
        "serves"      varchar(50)  NOT NULL DEFAULT '4',
        "basePrice"   decimal(8,2) NOT NULL,
        "priceLabel"  varchar(50)  NOT NULL DEFAULT '+tax',
        "mealType"    varchar(50)  NOT NULL DEFAULT 'combo',
        "availableFor" text[]      NOT NULL DEFAULT '{}',
        "items"       text[]       NOT NULL DEFAULT '{}',
        "isActive"    boolean      NOT NULL DEFAULT true,
        "sortOrder"   integer      NOT NULL DEFAULT 0,
        "imageUrls"   text[]       NOT NULL DEFAULT '{}',
        "createdAt"   TIMESTAMP    NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_family_meals" PRIMARY KEY ("id")
      )
    `);

    // ─── Create family_meal_addons table ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "family_meal_addons" (
        "id"           uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "familyMealId" uuid         NOT NULL,
        "name"         varchar(255) NOT NULL,
        "price"        decimal(8,2) NOT NULL DEFAULT 0,
        "isAvailable"  boolean      NOT NULL DEFAULT true,
        "sortOrder"    integer      NOT NULL DEFAULT 0,
        CONSTRAINT "PK_family_meal_addons" PRIMARY KEY ("id"),
        CONSTRAINT "FK_family_meal_addons_meal"
          FOREIGN KEY ("familyMealId")
          REFERENCES "family_meals"("id")
          ON DELETE CASCADE
      )
    `);

    // ─── Seed: Family Combo Packages ──────────────────────────────────────────

    // Combo #1
    await queryRunner.query(`
      INSERT INTO "family_meals"
        ("name", "description", "serves", "basePrice", "priceLabel", "mealType", "availableFor", "items", "isActive", "sortOrder")
      VALUES (
        'Family Dinner Combo #1',
        'A hearty Italian dinner for the whole family, featuring your choice of classic chicken or veal entrée with pasta or roasted vegetables and all the sides.',
        '4',
        69.95,
        '+tax',
        'combo',
        ARRAY['dine_in','take_out','delivery'],
        ARRAY[
          'Caesar Salad or Mixed Greens',
          'Garlic Bread',
          'Penne Tomato or Roast Potato & Veg',
          'Choice of: Chicken Marsala, Chicken Parmigiana, Veal Parmigiana, or Chicken Limone'
        ],
        true,
        10
      )
    `);

    await queryRunner.query(`
      INSERT INTO "family_meal_addons" ("familyMealId", "name", "price", "isAvailable", "sortOrder")
      SELECT id, 'Add Garlic Bread', 3.95, true, 0 FROM "family_meals" WHERE "name" = 'Family Dinner Combo #1'
      UNION ALL
      SELECT id, 'Add Extra Protein', 14.95, true, 1 FROM "family_meals" WHERE "name" = 'Family Dinner Combo #1'
    `);

    // Combo #2
    await queryRunner.query(`
      INSERT INTO "family_meals"
        ("name", "description", "serves", "basePrice", "priceLabel", "mealType", "availableFor", "items", "isActive", "sortOrder")
      VALUES (
        'Family Dinner Combo #2',
        'The perfect crowd-pleaser — pizza and wings for the family with a fresh salad to start.',
        '4',
        59.95,
        '+tax',
        'combo',
        ARRAY['dine_in','take_out','delivery'],
        ARRAY[
          'Caesar Salad or Mixed Greens',
          '2x Cheese Pizza',
          '2 LB Wings (Any Flavour)'
        ],
        true,
        20
      )
    `);

    await queryRunner.query(`
      INSERT INTO "family_meal_addons" ("familyMealId", "name", "price", "isAvailable", "sortOrder")
      SELECT id, 'Add Garlic Bread (4 Pieces)', 3.95, true, 0 FROM "family_meals" WHERE "name" = 'Family Dinner Combo #2'
      UNION ALL
      SELECT id, 'Upgrade to Any Pizza', 3.95, true, 1 FROM "family_meals" WHERE "name" = 'Family Dinner Combo #2'
    `);

    // Combo #3
    await queryRunner.query(`
      INSERT INTO "family_meals"
        ("name", "description", "serves", "basePrice", "priceLabel", "mealType", "availableFor", "items", "isActive", "sortOrder")
      VALUES (
        'Family Dinner Combo #3',
        'A satisfying mix of pizza and pasta alongside a fresh salad — a family favourite with something for everyone.',
        '4',
        59.95,
        '+tax',
        'combo',
        ARRAY['dine_in','take_out','delivery'],
        ARRAY[
          'Caesar Salad or Mixed Greens',
          '2x Cheese Pizza',
          '2x Pasta (Tomato, Alfredo or Rose)'
        ],
        true,
        30
      )
    `);

    await queryRunner.query(`
      INSERT INTO "family_meal_addons" ("familyMealId", "name", "price", "isAvailable", "sortOrder")
      SELECT id, 'Upgrade to Any Pizza', 3.95, true, 0 FROM "family_meals" WHERE "name" = 'Family Dinner Combo #3'
      UNION ALL
      SELECT id, 'Upgrade to Any Pasta (not Seafood)', 3.95, true, 1 FROM "family_meals" WHERE "name" = 'Family Dinner Combo #3'
      UNION ALL
      SELECT id, 'Seafood Pasta Upgrade', 5.95, true, 2 FROM "family_meals" WHERE "name" = 'Family Dinner Combo #3'
    `);

    // Combo #4
    await queryRunner.query(`
      INSERT INTO "family_meals"
        ("name", "description", "serves", "basePrice", "priceLabel", "mealType", "availableFor", "items", "isActive", "sortOrder")
      VALUES (
        'Family Dinner Combo #4',
        'A generous pasta tray to feed the whole family — choose your sauce and enjoy a simple, satisfying Italian classic.',
        '4',
        49.95,
        '+tax',
        'combo',
        ARRAY['dine_in','take_out','delivery'],
        ARRAY[
          'Pasta Tray for 4 (Tomato, Alfredo or Rose)'
        ],
        true,
        40
      )
    `);

    await queryRunner.query(`
      INSERT INTO "family_meal_addons" ("familyMealId", "name", "price", "isAvailable", "sortOrder")
      SELECT id, 'Add Garlic Bread (4 Pieces)', 3.95, true, 0 FROM "family_meals" WHERE "name" = 'Family Dinner Combo #4'
      UNION ALL
      SELECT id, 'Upgrade to Any Pasta (not Seafood)', 15.95, true, 1 FROM "family_meals" WHERE "name" = 'Family Dinner Combo #4'
      UNION ALL
      SELECT id, 'Seafood Pasta Upgrade', 23.95, true, 2 FROM "family_meals" WHERE "name" = 'Family Dinner Combo #4'
    `);

    // ─── Seed: Daily Specials ─────────────────────────────────────────────────

    // Roast Beef Sunday
    await queryRunner.query(`
      INSERT INTO "family_meals"
        ("name", "description", "serves", "basePrice", "priceLabel", "mealType", "availableFor", "items", "isActive", "sortOrder")
      VALUES (
        'Roast Beef Sunday',
        'Enjoy a classic Sunday roast beef dinner — available for take-out and delivery every Sunday.',
        'Per Person',
        29.95,
        '+tax',
        'daily_special',
        ARRAY['take_out','delivery'],
        ARRAY['Classic Roast Beef Dinner'],
        true,
        50
      )
    `);

    // Pizza & Pasta Wednesday
    await queryRunner.query(`
      INSERT INTO "family_meals"
        ("name", "description", "serves", "basePrice", "priceLabel", "mealType", "availableFor", "items", "isActive", "sortOrder")
      VALUES (
        'Pizza & Pasta Wednesday',
        'Dine-in deal every Wednesday — enjoy pizza and pasta at an unbeatable price.',
        'Per Person',
        15.95,
        '+tax',
        'daily_special',
        ARRAY['dine_in'],
        ARRAY['Pizza & Pasta Dine-In Special'],
        true,
        60
      )
    `);

    await queryRunner.query(`
      INSERT INTO "family_meal_addons" ("familyMealId", "name", "price", "isAvailable", "sortOrder")
      SELECT id, 'Add Seafood', 3.95, true, 0 FROM "family_meals" WHERE "name" = 'Pizza & Pasta Wednesday'
    `);

    // Pizza & Pasta Thursday
    await queryRunner.query(`
      INSERT INTO "family_meals"
        ("name", "description", "serves", "basePrice", "priceLabel", "mealType", "availableFor", "items", "isActive", "sortOrder")
      VALUES (
        'Pizza & Pasta Thursday',
        'Take-out deal every Thursday — get your pizza and pasta fix to enjoy at home.',
        'Per Person',
        15.95,
        '+tax',
        'daily_special',
        ARRAY['take_out'],
        ARRAY['Pizza & Pasta Take-Out Special'],
        true,
        70
      )
    `);

    await queryRunner.query(`
      INSERT INTO "family_meal_addons" ("familyMealId", "name", "price", "isAvailable", "sortOrder")
      SELECT id, 'Add Seafood', 3.95, true, 0 FROM "family_meals" WHERE "name" = 'Pizza & Pasta Thursday'
    `);

    // Kids Eat Free Monday
    await queryRunner.query(`
      INSERT INTO "family_meals"
        ("name", "description", "serves", "basePrice", "priceLabel", "mealType", "availableFor", "items", "isActive", "sortOrder")
      VALUES (
        'Kids Eat Free Monday',
        'Bring the whole family in for lunch every Monday — kids eat free with the purchase of an adult meal.',
        'Per Kid',
        0.00,
        'FREE',
        'daily_special',
        ARRAY['dine_in'],
        ARRAY['Kids Eat FREE with purchase of adult meal', 'Available for Lunch'],
        true,
        80
      )
    `);

    // Add House or Caesar Salad to any Combo
    await queryRunner.query(`
      INSERT INTO "family_meal_addons" ("familyMealId", "name", "price", "isAvailable", "sortOrder")
      SELECT id, 'Add House or Caesar Salad', 5.95, true, 99 FROM "family_meals" WHERE "mealType" = 'combo'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "family_meal_addons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "family_meals"`);
  }
}
