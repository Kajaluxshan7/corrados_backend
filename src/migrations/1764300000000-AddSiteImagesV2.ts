import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds 15 additional site-image slots that were previously hardcoded
 * in the frontend but not exposed through the CMS:
 *  - Home: Featured Menu Category cards (4)
 *  - Home: Private Events section image (1)
 *  - About: "What We Offer" cards (4)
 *  - Gift Cards: Occasion cards (6)
 */
export class AddSiteImagesV21764300000000 implements MigrationInterface {
  name = 'AddSiteImagesV21764300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{
      key: string;
      label: string;
      description: string;
      category: string;
      imageUrl: string;
    }> = [
      // ── Home: Featured Menu Category Cards ───────────────────────────────────
      {
        key: 'home_menu_appetizers',
        label: 'Home: Appetizers Card',
        description: 'Image on the Appetizers card in the Featured Menu Categories section on the Home page',
        category: 'home_sections',
        imageUrl: '/restaurant/arancini-tomato.jpeg',
      },
      {
        key: 'home_menu_pasta',
        label: 'Home: Pasta Card',
        description: 'Image on the Pasta card in the Featured Menu Categories section on the Home page',
        category: 'home_sections',
        imageUrl: '/restaurant/ravioli-mushroom-spinach.jpeg',
      },
      {
        key: 'home_menu_pizza',
        label: 'Home: Pizza Card',
        description: 'Image on the Pizza card in the Featured Menu Categories section on the Home page',
        category: 'home_sections',
        imageUrl: '/orrdos/pizza-corrados.jpg',
      },
      {
        key: 'home_menu_mains',
        label: 'Home: Mains Card',
        description: 'Image on the Mains card in the Featured Menu Categories section on the Home page',
        category: 'home_sections',
        imageUrl: '/restaurant/beef-short-rib.jpeg',
      },
      // ── Home: Private Events Section ─────────────────────────────────────────
      {
        key: 'home_private_events',
        label: 'Home: Private Events Photo',
        description: 'Photo beside the Private Events / Party Menus CTA section on the Home page',
        category: 'home_sections',
        imageUrl: '/orrdos/interior-upstairs.jpg',
      },
      // ── About: "What We Offer" Cards ─────────────────────────────────────────
      {
        key: 'about_offer_cuisine',
        label: 'About: Authentic Italian Cuisine Card',
        description: 'Card image for the "Authentic Italian Cuisine" offer on the About page',
        category: 'about',
        imageUrl: '/restaurant/gnocchi-tomato-cream.jpeg',
      },
      {
        key: 'about_offer_family',
        label: 'About: Family-Friendly Card',
        description: 'Card image for the "Family-Friendly Atmosphere" offer on the About page',
        category: 'about',
        imageUrl: '/restaurant/family-meal-takeout.jpeg',
      },
      {
        key: 'about_offer_bar',
        label: 'About: Curated Bar & Wine Card',
        description: 'Card image for the "Curated Bar & Wine" offer on the About page',
        category: 'about',
        imageUrl: '/restaurant/valentine-martini.jpeg',
      },
      {
        key: 'about_offer_events',
        label: 'About: Events & Entertainment Card',
        description: 'Card image for the "Events & Entertainment" offer on the About page',
        category: 'about',
        imageUrl: '/restaurant/catering-dessert-display.jpeg',
      },
      // ── Gift Cards: Occasion Cards ───────────────────────────────────────────
      {
        key: 'gift_card_birthday',
        label: 'Gift Cards: Birthdays',
        description: 'Image for the Birthdays occasion card on the Gift Cards page',
        category: 'gift_cards',
        imageUrl: '/restaurant/catering-dessert-display.jpeg',
      },
      {
        key: 'gift_card_anniversary',
        label: 'Gift Cards: Anniversaries',
        description: 'Image for the Anniversaries occasion card on the Gift Cards page',
        category: 'gift_cards',
        imageUrl: '/restaurant/salmon-beurre-blanc.jpeg',
      },
      {
        key: 'gift_card_holiday',
        label: 'Gift Cards: Holidays',
        description: 'Image for the Holidays occasion card on the Gift Cards page',
        category: 'gift_cards',
        imageUrl: '/restaurant/tiramisu.jpeg',
      },
      {
        key: 'gift_card_corporate',
        label: 'Gift Cards: Corporate Gifts',
        description: 'Image for the Corporate Gifts occasion card on the Gift Cards page',
        category: 'gift_cards',
        imageUrl: '/restaurant/menu-spread.jpeg',
      },
      {
        key: 'gift_card_thank_you',
        label: 'Gift Cards: Thank You',
        description: 'Image for the Thank You occasion card on the Gift Cards page',
        category: 'gift_cards',
        imageUrl: '/restaurant/burrata-caprese.jpeg',
      },
      {
        key: 'gift_card_just_because',
        label: 'Gift Cards: Just Because',
        description: 'Image for the "Just Because" occasion card on the Gift Cards page',
        category: 'gift_cards',
        imageUrl: '/restaurant/chocolate-lava-cake.jpeg',
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
    const keys = [
      'home_menu_appetizers',
      'home_menu_pasta',
      'home_menu_pizza',
      'home_menu_mains',
      'home_private_events',
      'about_offer_cuisine',
      'about_offer_family',
      'about_offer_bar',
      'about_offer_events',
      'gift_card_birthday',
      'gift_card_anniversary',
      'gift_card_holiday',
      'gift_card_corporate',
      'gift_card_thank_you',
      'gift_card_just_because',
    ];
    await queryRunner.query(
      `DELETE FROM "site_images" WHERE "key" = ANY($1)`,
      [keys],
    );
  }
}
