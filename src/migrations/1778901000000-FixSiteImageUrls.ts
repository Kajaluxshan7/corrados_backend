import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSiteImageUrls1778901000000 implements MigrationInterface {
    name = 'FixSiteImageUrls1778901000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix the 3 broken seeded records (only if they still point to the missing files)
        await queryRunner.query(`
            UPDATE site_images
            SET "imageUrl" = '/orrdos/interior-main-dining.jpg',
                "defaultImageUrl" = '/orrdos/interior-main-dining.jpg'
            WHERE key = 'hero_home'
              AND "imageUrl" = '/restaurant/hero-home.jpg'
        `);

        await queryRunner.query(`
            UPDATE site_images
            SET "imageUrl" = '/restaurant/owner_and_logo.jpg',
                "defaultImageUrl" = '/restaurant/owner_and_logo.jpg'
            WHERE key = 'hero_about'
              AND "imageUrl" = '/restaurant/hero-about.jpg'
        `);

        await queryRunner.query(`
            UPDATE site_images
            SET "imageUrl" = '/restaurant/gnocchi-tomato-cream.jpeg',
                "defaultImageUrl" = '/restaurant/gnocchi-tomato-cream.jpeg'
            WHERE key = 'nav_menus'
              AND "imageUrl" = '/restaurant/nav-menus.jpg'
        `);

        // Insert all remaining site-image keys that may not yet exist in DB.
        // ON CONFLICT DO NOTHING preserves any images already uploaded via the admin dashboard.
        await queryRunner.query(`
            INSERT INTO site_images (key, label, description, category, "imageUrl", "defaultImageUrl")
            VALUES
              -- Heroes
              ('hero_home',        'Home Page Hero',          'Main banner on the landing page',          'heroes',          '/orrdos/interior-main-dining.jpg',             '/orrdos/interior-main-dining.jpg'),
              ('hero_about',       'About Page Hero',         'Banner on the about page',                 'heroes',          '/restaurant/owner_and_logo.jpg',               '/restaurant/owner_and_logo.jpg'),
              ('hero_menus',       'Menus Page Hero',         'Banner on the menus page',                 'heroes',          '/restaurant/gnocchi-tomato-cream.jpeg',         '/restaurant/gnocchi-tomato-cream.jpeg'),
              ('hero_specials',    'Specials Page Hero',      'Banner on the specials page',              'heroes',          '/restaurant/penne-primavera.jpeg',              '/restaurant/penne-primavera.jpeg'),
              ('hero_events',      'Events Page Hero',        'Banner on the events page',                'heroes',          '/restaurant/catering-dessert-display.jpeg',     '/restaurant/catering-dessert-display.jpeg'),
              ('hero_family_meals','Family Meals Page Hero',  'Banner on the family meals page',          'heroes',          '/restaurant/family-meal-takeout.jpeg',          '/restaurant/family-meal-takeout.jpeg'),
              ('hero_party_menus', 'Party Menus Page Hero',   'Banner on the party menus page',           'heroes',          '/restaurant/catering-dessert-display.jpeg',     '/restaurant/catering-dessert-display.jpeg'),
              ('hero_gallery',     'Gallery Page Hero',       'Banner on the gallery page',               'heroes',          '/restaurant/seafood-linguine.jpeg',             '/restaurant/seafood-linguine.jpeg'),
              ('hero_contact',     'Contact Page Hero',       'Banner on the contact page',               'heroes',          '/restaurant/antipasto-platter.jpeg',            '/restaurant/antipasto-platter.jpeg'),
              ('hero_gift_cards',  'Gift Cards Page Hero',    'Banner on the gift cards page',            'heroes',          '/restaurant/chocolate-cup-dessert.jpeg',        '/restaurant/chocolate-cup-dessert.jpeg'),
              -- Nav tiles
              ('nav_about',        'About Nav Tile',          'Navigation tile for about page',           'nav_tiles',       '/restaurant/chef-pizza-oven.jpeg',              '/restaurant/chef-pizza-oven.jpeg'),
              ('nav_menus',        'Menus Nav Tile',          'Navigation tile for menus page',           'nav_tiles',       '/restaurant/gnocchi-tomato-cream.jpeg',         '/restaurant/gnocchi-tomato-cream.jpeg'),
              ('nav_specials',     'Specials Nav Tile',       'Navigation tile for specials page',        'nav_tiles',       '/restaurant/ravioli-mushroom-spinach.jpeg',     '/restaurant/ravioli-mushroom-spinach.jpeg'),
              ('nav_events',       'Events Nav Tile',         'Navigation tile for events page',          'nav_tiles',       '/restaurant/menu-spread.jpeg',                  '/restaurant/menu-spread.jpeg'),
              ('nav_family_meals', 'Family Meals Nav Tile',   'Navigation tile for family meals page',    'nav_tiles',       '/restaurant/family-meal-takeout.jpeg',          '/restaurant/family-meal-takeout.jpeg'),
              ('nav_party_menus',  'Party Menus Nav Tile',    'Navigation tile for party menus page',     'nav_tiles',       '/restaurant/catering-dessert-display.jpeg',     '/restaurant/catering-dessert-display.jpeg'),
              ('nav_gallery',      'Gallery Nav Tile',        'Navigation tile for gallery page',         'nav_tiles',       '/restaurant/seafood-linguine.jpeg',             '/restaurant/seafood-linguine.jpeg'),
              ('nav_contact',      'Contact Nav Tile',        'Navigation tile for contact page',         'nav_tiles',       '/restaurant/antipasto-platter.jpeg',            '/restaurant/antipasto-platter.jpeg'),
              -- Home page sections
              ('home_about_owner',       'Owner Photo',              'Owner photo in the home about section',     'home_sections',   '/restaurant/owner_and_logo.jpg',               '/restaurant/owner_and_logo.jpg'),
              ('home_menu_appetizers',   'Menu Preview – Appetizers','Appetizers preview card on the home page',  'home_sections',   '/restaurant/arancini-tomato.jpeg',             '/restaurant/arancini-tomato.jpeg'),
              ('home_menu_pasta',        'Menu Preview – Pasta',     'Pasta preview card on the home page',       'home_sections',   '/restaurant/ravioli-mushroom-spinach.jpeg',    '/restaurant/ravioli-mushroom-spinach.jpeg'),
              ('home_menu_pizza',        'Menu Preview – Pizza',     'Pizza preview card on the home page',       'home_sections',   '/orrdos/pizza-corrados.jpg',                   '/orrdos/pizza-corrados.jpg'),
              ('home_menu_mains',        'Menu Preview – Mains',     'Mains preview card on the home page',       'home_sections',   '/restaurant/beef-short-rib.jpeg',              '/restaurant/beef-short-rib.jpeg'),
              ('home_family_meals_bg',   'Family Meals Background',  'Background for the family meals section',   'home_sections',   '/restaurant/catering-fruit-platter.jpeg',      '/restaurant/catering-fruit-platter.jpeg'),
              ('home_private_events',    'Private Events Photo',     'Photo for the private events section',      'home_sections',   '/orrdos/interior-upstairs.jpg',                '/orrdos/interior-upstairs.jpg'),
              -- About page sections
              ('about_heritage',         'Heritage Image',           'Heritage section image on the about page',  'about_sections',  '/restaurant/menu-spread.jpeg',                 '/restaurant/menu-spread.jpeg'),
              ('about_offer_cuisine',    'Offer – Cuisine',          'Cuisine card in what we offer section',     'about_sections',  '/restaurant/gnocchi-tomato-cream.jpeg',         '/restaurant/gnocchi-tomato-cream.jpeg'),
              ('about_offer_family',     'Offer – Family',           'Family card in what we offer section',      'about_sections',  '/restaurant/family-meal-takeout.jpeg',          '/restaurant/family-meal-takeout.jpeg'),
              ('about_offer_bar',        'Offer – Bar & Wine',       'Bar card in what we offer section',         'about_sections',  '/restaurant/valentine-martini.jpeg',            '/restaurant/valentine-martini.jpeg'),
              ('about_offer_events',     'Offer – Events',           'Events card in what we offer section',      'about_sections',  '/restaurant/catering-dessert-display.jpeg',     '/restaurant/catering-dessert-display.jpeg'),
              ('about_cta',              'About CTA Image',          'Call-to-action image at the bottom of about','about_sections', '/restaurant/pork-roll-jus.jpeg',               '/restaurant/pork-roll-jus.jpeg'),
              -- Gift cards
              ('gift_card_birthday',     'Gift Card – Birthday',     'Birthday gift card image',                  'gift_cards',      '/restaurant/catering-dessert-display.jpeg',     '/restaurant/catering-dessert-display.jpeg'),
              ('gift_card_anniversary',  'Gift Card – Anniversary',  'Anniversary gift card image',               'gift_cards',      '/restaurant/salmon-beurre-blanc.jpeg',          '/restaurant/salmon-beurre-blanc.jpeg'),
              ('gift_card_holiday',      'Gift Card – Holiday',      'Holiday gift card image',                   'gift_cards',      '/restaurant/tiramisu.jpeg',                     '/restaurant/tiramisu.jpeg'),
              ('gift_card_corporate',    'Gift Card – Corporate',    'Corporate gift card image',                 'gift_cards',      '/restaurant/menu-spread.jpeg',                  '/restaurant/menu-spread.jpeg'),
              ('gift_card_thank_you',    'Gift Card – Thank You',    'Thank you gift card image',                 'gift_cards',      '/restaurant/burrata-caprese.jpeg',              '/restaurant/burrata-caprese.jpeg'),
              ('gift_card_just_because', 'Gift Card – Just Because', 'Just because gift card image',              'gift_cards',      '/restaurant/chocolate-lava-cake.jpeg',          '/restaurant/chocolate-lava-cake.jpeg')
            ON CONFLICT (key) DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore the 3 previously broken seeded records back to their (incorrect) original URLs
        await queryRunner.query(`
            UPDATE site_images
            SET "imageUrl" = '/restaurant/hero-home.jpg',
                "defaultImageUrl" = '/restaurant/hero-home.jpg'
            WHERE key = 'hero_home'
              AND "imageUrl" = '/orrdos/interior-main-dining.jpg'
        `);

        await queryRunner.query(`
            UPDATE site_images
            SET "imageUrl" = '/restaurant/hero-about.jpg',
                "defaultImageUrl" = '/restaurant/hero-about.jpg'
            WHERE key = 'hero_about'
              AND "imageUrl" = '/restaurant/owner_and_logo.jpg'
        `);

        await queryRunner.query(`
            UPDATE site_images
            SET "imageUrl" = '/restaurant/nav-menus.jpg',
                "defaultImageUrl" = '/restaurant/nav-menus.jpg'
            WHERE key = 'nav_menus'
              AND "imageUrl" = '/restaurant/gnocchi-tomato-cream.jpeg'
        `);

        // Remove all the newly inserted keys (those that didn't exist before this migration)
        await queryRunner.query(`
            DELETE FROM site_images
            WHERE key IN (
              'hero_menus','hero_specials','hero_events','hero_family_meals','hero_party_menus',
              'hero_gallery','hero_contact','hero_gift_cards',
              'nav_about','nav_specials','nav_events','nav_family_meals','nav_party_menus','nav_gallery','nav_contact',
              'home_about_owner','home_menu_appetizers','home_menu_pasta','home_menu_pizza','home_menu_mains',
              'home_family_meals_bg','home_private_events',
              'about_heritage','about_offer_cuisine','about_offer_family','about_offer_bar','about_offer_events','about_cta',
              'gift_card_birthday','gift_card_anniversary','gift_card_holiday','gift_card_corporate',
              'gift_card_thank_you','gift_card_just_because'
            )
        `);
    }
}
