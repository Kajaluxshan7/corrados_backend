import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the site_images table and seeds the 23 default image slots
 * that the public frontend uses as static/hardcoded images.
 */
export class AddSiteImages1764200000000 implements MigrationInterface {
  name = 'AddSiteImages1764200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Create table ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "site_images" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key"             character varying NOT NULL,
        "label"           character varying NOT NULL,
        "description"     character varying,
        "category"        character varying NOT NULL,
        "imageUrl"        character varying NOT NULL,
        "defaultImageUrl" character varying NOT NULL,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_site_images_key" UNIQUE ("key"),
        CONSTRAINT "PK_site_images" PRIMARY KEY ("id")
      )
    `);

    // ── Seed default image slots ──────────────────────────────────────────────
    const rows: Array<{
      key: string;
      label: string;
      description: string;
      category: string;
      imageUrl: string;
    }> = [
      // ── Heroes ──────────────────────────────────────────────────────────────
      {
        key: 'hero_about',
        label: 'About Page Hero',
        description: 'Full-width hero background on the About page',
        category: 'heroes',
        imageUrl: '/restaurant/owner_and_logo.jpg',
      },
      {
        key: 'hero_menus',
        label: 'Menus Page Hero',
        description: 'Full-width hero background on the Menus page',
        category: 'heroes',
        imageUrl: '/restaurant/gnocchi-tomato-cream.jpeg',
      },
      {
        key: 'hero_specials',
        label: 'Specials Page Hero',
        description: 'Full-width hero background on the Specials page',
        category: 'heroes',
        imageUrl: '/restaurant/penne-primavera.jpeg',
      },
      {
        key: 'hero_events',
        label: 'Events Page Hero',
        description: 'Full-width hero background on the Events page',
        category: 'heroes',
        imageUrl: '/restaurant/catering-dessert-display.jpeg',
      },
      {
        key: 'hero_gallery',
        label: 'Gallery Page Hero',
        description: 'Full-width hero background on the Gallery page',
        category: 'heroes',
        imageUrl: '/restaurant/seafood-linguine.jpeg',
      },
      {
        key: 'hero_family_meals',
        label: 'Family Meals Page Hero',
        description: 'Full-width hero background on the Family Meals page',
        category: 'heroes',
        imageUrl: '/restaurant/family-meal-takeout.jpeg',
      },
      {
        key: 'hero_party_menus',
        label: 'Party Menus Page Hero',
        description: 'Full-width hero background on the Party Menus page',
        category: 'heroes',
        imageUrl: '/restaurant/catering-dessert-display.jpeg',
      },
      {
        key: 'hero_gift_cards',
        label: 'Gift Cards Page Hero',
        description: 'Full-width hero background on the Gift Cards page',
        category: 'heroes',
        imageUrl: '/restaurant/chocolate-cup-dessert.jpeg',
      },
      {
        key: 'hero_contact',
        label: 'Contact Page Hero',
        description: 'Full-width hero background on the Contact page',
        category: 'heroes',
        imageUrl: '/restaurant/antipasto-platter.jpeg',
      },
      // ── Home Navigation Tiles ────────────────────────────────────────────────
      {
        key: 'nav_about',
        label: 'Home: About Tile',
        description:
          'Background image on the About navigation tile on the Home page',
        category: 'nav_tiles',
        imageUrl: '/restaurant/chef-pizza-oven.jpeg',
      },
      {
        key: 'nav_menus',
        label: 'Home: Menus Tile',
        description:
          'Background image on the Menus navigation tile on the Home page',
        category: 'nav_tiles',
        imageUrl: '/restaurant/gnocchi-tomato-cream.jpeg',
      },
      {
        key: 'nav_specials',
        label: 'Home: Specials Tile',
        description:
          'Background image on the Specials navigation tile on the Home page',
        category: 'nav_tiles',
        imageUrl: '/restaurant/ravioli-mushroom-spinach.jpeg',
      },
      {
        key: 'nav_family_meals',
        label: 'Home: Family Meals Tile',
        description:
          'Background image on the Family Meals navigation tile on the Home page',
        category: 'nav_tiles',
        imageUrl: '/restaurant/family-meal-takeout.jpeg',
      },
      {
        key: 'nav_party_menus',
        label: 'Home: Party Menus Tile',
        description:
          'Background image on the Party Menus navigation tile on the Home page',
        category: 'nav_tiles',
        imageUrl: '/restaurant/catering-dessert-display.jpeg',
      },
      {
        key: 'nav_events',
        label: 'Home: Events Tile',
        description:
          'Background image on the Events navigation tile on the Home page',
        category: 'nav_tiles',
        imageUrl: '/restaurant/menu-spread.jpeg',
      },
      {
        key: 'nav_gallery',
        label: 'Home: Gallery Tile',
        description:
          'Background image on the Gallery navigation tile on the Home page',
        category: 'nav_tiles',
        imageUrl: '/restaurant/seafood-linguine.jpeg',
      },
      {
        key: 'nav_contact',
        label: 'Home: Contact Tile',
        description:
          'Background image on the Contact navigation tile on the Home page',
        category: 'nav_tiles',
        imageUrl: '/restaurant/antipasto-platter.jpeg',
      },
      // ── Home Section Backgrounds ─────────────────────────────────────────────
      {
        key: 'home_family_meals_bg',
        label: 'Home: Family Meals Section Background',
        description:
          'Background image behind the Family Meals highlight section on the Home page',
        category: 'home_sections',
        imageUrl: '/restaurant/catering-fruit-platter.jpeg',
      },
      // ── About Page ───────────────────────────────────────────────────────────
      {
        key: 'about_heritage',
        label: 'About: Heritage Photo',
        description: 'Photo beside the heritage/story text on the About page',
        category: 'about',
        imageUrl: '/restaurant/menu-spread.jpeg',
      },
      {
        key: 'about_cta',
        label: 'About: Visit / CTA Photo',
        description:
          'Photo beside the visit/CTA section at the bottom of the About page',
        category: 'about',
        imageUrl: '/restaurant/pork-roll-jus.jpeg',
      },
      // ── Family Meal Cards ────────────────────────────────────────────────────
      {
        key: 'family_meal_classic_italian',
        label: 'Family Meal: Classic Italian Dinner',
        description: 'Card image for the Classic Italian Family Dinner package',
        category: 'family_meals',
        imageUrl: '/restaurant/shrimp-fettuccine.jpeg',
      },
      {
        key: 'family_meal_pizza_party',
        label: 'Family Meal: Pizza Party Pack',
        description: 'Card image for the Pizza Party Pack package',
        category: 'family_meals',
        imageUrl: '/restaurant/pizza-margherita.jpeg',
      },
      {
        key: 'family_meal_sunday_feast',
        label: 'Family Meal: Sunday Italian Feast',
        description: 'Card image for the Sunday Italian Feast package',
        category: 'family_meals',
        imageUrl: '/restaurant/beef-roast-jus.jpeg',
      },
      {
        key: 'family_meal_date_night',
        label: 'Family Meal: Date Night for Two',
        description: 'Card image for the Date Night for Two package',
        category: 'family_meals',
        imageUrl: '/restaurant/salmon-beurre-blanc.jpeg',
      },
    ];

    for (const row of rows) {
      await queryRunner.query(
        `
        INSERT INTO "site_images" ("key", "label", "description", "category", "imageUrl", "defaultImageUrl")
        VALUES ($1, $2, $3, $4, $5, $5)
        ON CONFLICT ("key") DO NOTHING
        `,
        [row.key, row.label, row.description, row.category, row.imageUrl],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "site_images"`);
  }
}
