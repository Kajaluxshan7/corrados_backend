/**
 * Development database seeder.
 *
 * Populates every table (except `users`) with realistic sample data so the
 * frontend and admin panel have something to render in local development.
 *
 * Usage:  npm run seed
 *
 * ⚠️  DEV ONLY — this TRUNCATEs all seeded tables before inserting.
 *     It refuses to run when NODE_ENV === 'production'.
 */
import { AppDataSource } from './data-source';
import { PrimaryCategory } from './entities/primary-category.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MeasurementType } from './entities/measurement-type.entity';
import { MenuItem } from './entities/menu-item.entity';
import { MenuItemMeasurement } from './entities/menu-item-measurement.entity';
import {
  Special,
  SpecialType,
  DayOfWeek,
  SpecialCategory,
} from './entities/special.entity';
import { Event, EventType } from './entities/event.entity';
import {
  OpeningHours,
  DayOfWeek as OhDayOfWeek,
} from './entities/opening-hours.entity';
import { Todo, TodoPriority, TodoStatus } from './entities/todo.entity';
import { StoryCategory } from './entities/story-category.entity';
import { Story } from './entities/story.entity';
import { Subscriber } from './entities/subscriber.entity';
import {
  ScheduledNotification,
  NotificationType,
  NotificationStatus,
} from './entities/scheduled-notification.entity';
import {
  Announcement,
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from './entities/announcement.entity';
import { PartyMenu } from './entities/party-menu.entity';
import { PartyMenuSection } from './entities/party-menu-section.entity';
import { PartyMenuSectionItem } from './entities/party-menu-section-item.entity';
import { FamilyMeal } from './entities/family-meal.entity';
import { FamilyMealAddon } from './entities/family-meal-addon.entity';
import { SiteImage } from './entities/site-image.entity';
import {
  DigitalMenuPdf,
  DigitalMenuCategory,
} from './entities/digital-menu-pdf.entity';
import { Poster } from './entities/poster.entity';
import { randomUUID } from 'crypto';

const daysFromNow = (n: number) =>
  new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run the seeder with NODE_ENV=production.');
  }

  await AppDataSource.initialize();
  console.log('📡 Data source initialized');

  const qr = AppDataSource.createQueryRunner();

  // ─── Wipe seeded tables (children first, RESTART IDENTITY, CASCADE) ──────────
  const tables = [
    'menu_item_measurements',
    'menu_items',
    'menu_categories',
    'primary_categories',
    'measurement_types',
    'party_menu_section_items',
    'party_menu_sections',
    'party_menus',
    'family_meal_addons',
    'family_meals',
    'stories',
    'story_categories',
    'specials',
    'events',
    'opening_hours',
    'todos',
    'subscribers',
    'scheduled_notifications',
    'announcements',
    'site_images',
    'digital_menu_pdfs',
    'posters',
  ];
  await qr.query(
    `TRUNCATE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );
  console.log('🧹 Cleared existing data');
  await qr.release();

  // ─── Primary categories ─────────────────────────────────────────────────────
  const primaryRepo = AppDataSource.getRepository(PrimaryCategory);
  const [foodPrimary, drinksPrimary] = await primaryRepo.save([
    primaryRepo.create({
      name: 'Food',
      description: 'All food menus',
      sortOrder: 0,
    }),
    primaryRepo.create({
      name: 'Drinks',
      description: 'Beverages & bar',
      sortOrder: 1,
    }),
  ]);

  // ─── Menu categories ────────────────────────────────────────────────────────
  const categoryRepo = AppDataSource.getRepository(MenuCategory);
  const [appetizers, mains, desserts, beer, cocktails] =
    await categoryRepo.save([
      categoryRepo.create({
        name: 'Appetizers',
        description: 'Starters & shareables',
        sortOrder: 0,
        primaryCategoryId: foodPrimary.id,
      }),
      categoryRepo.create({
        name: 'Mains',
        description: 'Hearty pub classics',
        sortOrder: 1,
        primaryCategoryId: foodPrimary.id,
      }),
      categoryRepo.create({
        name: 'Desserts',
        description: 'Sweet endings',
        sortOrder: 2,
        primaryCategoryId: foodPrimary.id,
      }),
      categoryRepo.create({
        name: 'Beer',
        description: 'Draught & bottled',
        sortOrder: 0,
        primaryCategoryId: drinksPrimary.id,
      }),
      categoryRepo.create({
        name: 'Cocktails',
        description: 'Handcrafted drinks',
        sortOrder: 1,
        primaryCategoryId: drinksPrimary.id,
      }),
    ]);

  // ─── Measurement types ──────────────────────────────────────────────────────
  const measurementRepo = AppDataSource.getRepository(MeasurementType);
  const [pint, pitcher, glassWine] = await measurementRepo.save([
    measurementRepo.create({
      name: 'Pint',
      description: '20oz pour',
      sortOrder: 0,
    }),
    measurementRepo.create({
      name: 'Pitcher',
      description: '60oz jug',
      sortOrder: 1,
    }),
    measurementRepo.create({
      name: 'Glass',
      description: '6oz wine pour',
      sortOrder: 2,
    }),
  ]);

  // ─── Menu items ─────────────────────────────────────────────────────────────
  const itemRepo = AppDataSource.getRepository(MenuItem);
  const measRepo = AppDataSource.getRepository(MenuItemMeasurement);

  await itemRepo.save([
    itemRepo.create({
      name: 'Loaded Nachos',
      description: 'Tortilla chips, cheese, jalapeños, salsa & sour cream',
      price: 14.5,
      preparationTime: 12,
      categoryId: appetizers.id,
      allergens: ['dairy', 'gluten'],
      dietaryInfo: ['vegetarian'],
      sortOrder: 0,
    }),
    itemRepo.create({
      name: 'Wings (1lb)',
      description: 'Choice of hot, BBQ, or honey garlic',
      price: 16.0,
      preparationTime: 15,
      categoryId: appetizers.id,
      allergens: [],
      dietaryInfo: ['gluten-free'],
      sortOrder: 1,
    }),
    itemRepo.create({
      name: 'Fish & Chips',
      description: 'Beer-battered haddock with hand-cut fries',
      price: 21.0,
      preparationTime: 18,
      categoryId: mains.id,
      allergens: ['gluten', 'fish'],
      dietaryInfo: [],
      sortOrder: 0,
    }),
    itemRepo.create({
      name: 'Corrado Burger',
      description: '8oz chuck patty, aged cheddar, bacon, brioche bun',
      price: 19.5,
      preparationTime: 16,
      categoryId: mains.id,
      allergens: ['gluten', 'dairy'],
      dietaryInfo: [],
      sortOrder: 1,
    }),
    itemRepo.create({
      name: 'Sticky Toffee Pudding',
      description: 'Warm date cake, toffee sauce, vanilla ice cream',
      price: 9.5,
      preparationTime: 8,
      categoryId: desserts.id,
      allergens: ['gluten', 'dairy', 'eggs'],
      dietaryInfo: ['vegetarian'],
      sortOrder: 0,
    }),
  ]);

  // Items priced by measurement
  const draught = await itemRepo.save(
    itemRepo.create({
      name: 'House Draught Lager',
      description: 'Crisp local lager on tap',
      categoryId: beer.id,
      hasMeasurements: true,
      sortOrder: 0,
    }),
  );
  const houseRed = await itemRepo.save(
    itemRepo.create({
      name: 'House Red Wine',
      description: 'Smooth Cabernet blend',
      categoryId: cocktails.id,
      hasMeasurements: true,
      sortOrder: 0,
    }),
  );
  await measRepo.save([
    measRepo.create({
      menuItemId: draught.id,
      measurementTypeId: pint.id,
      price: 7.5,
      sortOrder: 0,
    }),
    measRepo.create({
      menuItemId: draught.id,
      measurementTypeId: pitcher.id,
      price: 24.0,
      sortOrder: 1,
    }),
    measRepo.create({
      menuItemId: houseRed.id,
      measurementTypeId: glassWine.id,
      price: 9.0,
      sortOrder: 0,
    }),
  ]);

  // ─── Specials ───────────────────────────────────────────────────────────────
  const specialRepo = AppDataSource.getRepository(Special);
  await specialRepo.save([
    specialRepo.create({
      title: 'Wing Wednesday',
      description: '50¢ wings all day',
      type: SpecialType.DAILY,
      dayOfWeek: DayOfWeek.WEDNESDAY,
      specialCategory: SpecialCategory.REGULAR,
      sortOrder: 0,
    }),
    specialRepo.create({
      title: 'Late Night Poutine',
      description: '$8 poutine after 10pm',
      type: SpecialType.DAILY,
      dayOfWeek: DayOfWeek.FRIDAY,
      specialCategory: SpecialCategory.LATE_NIGHT,
      sortOrder: 1,
    }),
    specialRepo.create({
      title: 'Game Time Pitchers',
      description: '$20 pitchers during the game',
      type: SpecialType.GAME_TIME,
      sortOrder: 2,
    }),
    specialRepo.create({
      title: 'Summer Patio Series',
      description: 'Seasonal cocktails on the patio',
      type: SpecialType.SEASONAL,
      displayStartDate: daysFromNow(-5),
      displayEndDate: daysFromNow(60),
      specialStartDate: daysFromNow(0),
      specialEndDate: daysFromNow(60),
      sortOrder: 3,
    }),
  ]);

  // ─── Events ─────────────────────────────────────────────────────────────────
  const eventRepo = AppDataSource.getRepository(Event);
  await eventRepo.save([
    eventRepo.create({
      title: 'Friday Live Music',
      description: 'Local acoustic acts every Friday',
      type: EventType.LIVE_MUSIC,
      displayStartDate: daysFromNow(-2),
      displayEndDate: daysFromNow(7),
      eventStartDate: daysFromNow(2),
      eventEndDate: daysFromNow(2),
      imageUrls: [],
    }),
    eventRepo.create({
      title: 'Saturday Trivia Night',
      description: 'Win a $50 gift card — starts at 8pm',
      type: EventType.TRIVIA_NIGHT,
      displayStartDate: daysFromNow(-1),
      displayEndDate: daysFromNow(10),
      eventStartDate: daysFromNow(3),
      eventEndDate: daysFromNow(3),
      imageUrls: [],
    }),
  ]);

  // ─── Opening hours ──────────────────────────────────────────────────────────
  const ohRepo = AppDataSource.getRepository(OpeningHours);
  await ohRepo.save(
    [
      OhDayOfWeek.MONDAY,
      OhDayOfWeek.TUESDAY,
      OhDayOfWeek.WEDNESDAY,
      OhDayOfWeek.THURSDAY,
      OhDayOfWeek.FRIDAY,
      OhDayOfWeek.SATURDAY,
      OhDayOfWeek.SUNDAY,
    ].map((day) => {
      const isWeekend =
        day === OhDayOfWeek.FRIDAY || day === OhDayOfWeek.SATURDAY;
      return ohRepo.create({
        dayOfWeek: day,
        openTime: '11:00',
        closeTime: isWeekend ? '02:00' : '23:00',
        isClosedNextDay: isWeekend,
        isOpen: true,
        isActive: true,
      });
    }),
  );

  // ─── Todos (no users — createdById left null) ───────────────────────────────
  const todoRepo = AppDataSource.getRepository(Todo);
  await todoRepo.save([
    todoRepo.create({
      title: 'Restock draught kegs',
      description: 'Lager and IPA running low',
      priority: TodoPriority.HIGH,
      status: TodoStatus.PENDING,
      dueDate: daysFromNow(2),
    }),
    todoRepo.create({
      title: 'Update patio menu',
      description: 'Add summer cocktails',
      priority: TodoPriority.MEDIUM,
      status: TodoStatus.IN_PROGRESS,
    }),
    todoRepo.create({
      title: 'Schedule deep clean',
      priority: TodoPriority.LOW,
      status: TodoStatus.COMPLETED,
      completedAt: daysFromNow(-1),
    }),
  ]);

  // ─── Story categories + stories ─────────────────────────────────────────────
  const storyCatRepo = AppDataSource.getRepository(StoryCategory);
  const [behindScenes, foodStory] = await storyCatRepo.save([
    storyCatRepo.create({
      name: 'Behind the Scenes',
      description: 'Life at the pub',
      sortOrder: 0,
    }),
    storyCatRepo.create({
      name: 'Food & Drink',
      description: 'What we are serving',
      sortOrder: 1,
    }),
  ]);
  const storyRepo = AppDataSource.getRepository(Story);
  await storyRepo.save([
    storyRepo.create({
      categoryId: behindScenes.id,
      imageUrls: ['/restaurant/story-1.jpg'],
      sortOrder: 0,
    }),
    storyRepo.create({
      categoryId: foodStory.id,
      imageUrls: ['/restaurant/story-2.jpg', '/restaurant/story-3.jpg'],
      sortOrder: 0,
    }),
  ]);

  // ─── Subscribers ────────────────────────────────────────────────────────────
  const subRepo = AppDataSource.getRepository(Subscriber);
  await subRepo.save([
    subRepo.create({
      subscriberNumber: 1,
      email: 'alex.dev@example.com',
      unsubscribeToken: randomUUID(),
      promoCode: 'WELCOME1',
      promoCodeSent: true,
      promoSentAt: daysFromNow(-3),
    }),
    subRepo.create({
      subscriberNumber: 2,
      email: 'jordan.dev@example.com',
      unsubscribeToken: randomUUID(),
    }),
    subRepo.create({
      subscriberNumber: 3,
      email: 'sam.dev@example.com',
      unsubscribeToken: randomUUID(),
      isActive: false,
      unsubscribedAt: daysFromNow(-1),
    }),
  ]);

  // ─── Scheduled notifications ────────────────────────────────────────────────
  const notifRepo = AppDataSource.getRepository(ScheduledNotification);
  const firstSpecial = await specialRepo.findOne({
    where: {},
    order: { sortOrder: 'ASC' },
  });
  const firstEvent = await eventRepo.findOne({
    where: {},
    order: { createdAt: 'ASC' },
  });
  await notifRepo.save([
    notifRepo.create({
      type: NotificationType.SPECIAL,
      referenceId: firstSpecial!.id,
      scheduledFor: daysFromNow(1),
      status: NotificationStatus.PENDING,
    }),
    notifRepo.create({
      type: NotificationType.EVENT,
      referenceId: firstEvent!.id,
      scheduledFor: daysFromNow(-1),
      status: NotificationStatus.SENT,
      sentAt: daysFromNow(-1),
    }),
  ]);

  // ─── Announcements ──────────────────────────────────────────────────────────
  const annRepo = AppDataSource.getRepository(Announcement);
  await annRepo.save([
    annRepo.create({
      title: 'New Summer Menu',
      content: 'Our summer menu drops this weekend — come try it!',
      type: AnnouncementType.MENU_UPDATE,
      priority: AnnouncementPriority.NORMAL,
      status: AnnouncementStatus.SENT,
      recipientCount: 2,
      sentAt: daysFromNow(-2),
      ctaText: 'View Menu',
      ctaUrl: '/menu',
    }),
    annRepo.create({
      title: 'Holiday Hours',
      content: 'We will be closed on the upcoming statutory holiday.',
      type: AnnouncementType.HOLIDAY,
      priority: AnnouncementPriority.HIGH,
      status: AnnouncementStatus.DRAFT,
    }),
  ]);

  // ─── Party menus + sections + items ─────────────────────────────────────────
  const partyMenuRepo = AppDataSource.getRepository(PartyMenu);
  const partyMenu = await partyMenuRepo.save(
    partyMenuRepo.create({
      name: 'Classic Party Package',
      menuType: 'party',
      pricePerPerson: 39.99,
      minimumGuests: 10,
      maximumGuests: 60,
      description: 'A crowd-pleasing buffet-style package for groups.',
      imageUrls: [],
      pdfUrls: [],
      sortOrder: 0,
    }),
  );
  const sectionRepo = AppDataSource.getRepository(PartyMenuSection);
  const [startersSection, mainsSection] = await sectionRepo.save([
    sectionRepo.create({
      partyMenuId: partyMenu.id,
      title: 'Starters',
      sectionType: 'fixed',
      sortOrder: 0,
    }),
    sectionRepo.create({
      partyMenuId: partyMenu.id,
      title: 'Mains',
      sectionType: 'choice',
      instruction: 'Choose 2 per guest',
      sortOrder: 1,
    }),
  ]);
  const sectionItemRepo = AppDataSource.getRepository(PartyMenuSectionItem);
  await sectionItemRepo.save([
    sectionItemRepo.create({
      sectionId: startersSection.id,
      name: 'Bruschetta',
      description: 'Tomato, basil, garlic crostini',
      sortOrder: 0,
    }),
    sectionItemRepo.create({
      sectionId: startersSection.id,
      name: 'Caesar Salad',
      sortOrder: 1,
    }),
    sectionItemRepo.create({
      sectionId: mainsSection.id,
      name: 'Chicken Parmesan',
      sortOrder: 0,
    }),
    sectionItemRepo.create({
      sectionId: mainsSection.id,
      name: 'Penne Primavera',
      notes: 'Vegetarian',
      sortOrder: 1,
    }),
  ]);

  // ─── Family meals + addons ──────────────────────────────────────────────────
  const familyMealRepo = AppDataSource.getRepository(FamilyMeal);
  const familyMeal = await familyMealRepo.save(
    familyMealRepo.create({
      name: 'Family Pizza Combo',
      description: 'Feeds the whole family — salad, pizza, and dessert.',
      serves: '4',
      basePrice: 49.99,
      priceLabel: '+tax',
      mealType: 'combo',
      availableFor: ['dine_in', 'take_out', 'delivery'],
      items: [
        'Caesar Salad or Mixed Greens',
        '2x Large Cheese Pizza',
        '4x Garlic Knots',
      ],
      imageUrls: [],
      pdfUrls: [],
      sortOrder: 0,
    }),
  );
  const addonRepo = AppDataSource.getRepository(FamilyMealAddon);
  await addonRepo.save([
    addonRepo.create({
      familyMealId: familyMeal.id,
      name: 'Add Garlic Bread (4 Pieces)',
      price: 5.99,
      sortOrder: 0,
    }),
    addonRepo.create({
      familyMealId: familyMeal.id,
      name: 'Add 2L Soft Drink',
      price: 3.49,
      sortOrder: 1,
    }),
  ]);

  // ─── Site images ────────────────────────────────────────────────────────────
  const siteImageRepo = AppDataSource.getRepository(SiteImage);
  await siteImageRepo.save([
    // ── Heroes ──────────────────────────────────────────────────────────────
    siteImageRepo.create({
      key: 'hero_home',
      label: 'Home Page Hero',
      description: 'Main banner on the landing page',
      category: 'heroes',
      imageUrl: '/orrdos/interior-main-dining.jpg',
      defaultImageUrl: '/orrdos/interior-main-dining.jpg',
    }),
    siteImageRepo.create({
      key: 'hero_about',
      label: 'About Page Hero',
      description: 'Banner on the about page',
      category: 'heroes',
      imageUrl: '/restaurant/owner_and_logo.jpg',
      defaultImageUrl: '/restaurant/owner_and_logo.jpg',
    }),
    siteImageRepo.create({
      key: 'hero_menus',
      label: 'Menus Page Hero',
      description: 'Banner on the menus page',
      category: 'heroes',
      imageUrl: '/restaurant/gnocchi-tomato-cream.jpeg',
      defaultImageUrl: '/restaurant/gnocchi-tomato-cream.jpeg',
    }),
    siteImageRepo.create({
      key: 'hero_specials',
      label: 'Specials Page Hero',
      description: 'Banner on the specials page',
      category: 'heroes',
      imageUrl: '/restaurant/penne-primavera.jpeg',
      defaultImageUrl: '/restaurant/penne-primavera.jpeg',
    }),
    siteImageRepo.create({
      key: 'hero_events',
      label: 'Events Page Hero',
      description: 'Banner on the events page',
      category: 'heroes',
      imageUrl: '/restaurant/catering-dessert-display.jpeg',
      defaultImageUrl: '/restaurant/catering-dessert-display.jpeg',
    }),
    siteImageRepo.create({
      key: 'hero_family_meals',
      label: 'Family Meals Page Hero',
      description: 'Banner on the family meals page',
      category: 'heroes',
      imageUrl: '/restaurant/family-meal-takeout.jpeg',
      defaultImageUrl: '/restaurant/family-meal-takeout.jpeg',
    }),
    siteImageRepo.create({
      key: 'hero_party_menus',
      label: 'Party Menus Page Hero',
      description: 'Banner on the party menus page',
      category: 'heroes',
      imageUrl: '/restaurant/catering-dessert-display.jpeg',
      defaultImageUrl: '/restaurant/catering-dessert-display.jpeg',
    }),
    siteImageRepo.create({
      key: 'hero_gallery',
      label: 'Gallery Page Hero',
      description: 'Banner on the gallery page',
      category: 'heroes',
      imageUrl: '/restaurant/seafood-linguine.jpeg',
      defaultImageUrl: '/restaurant/seafood-linguine.jpeg',
    }),
    siteImageRepo.create({
      key: 'hero_contact',
      label: 'Contact Page Hero',
      description: 'Banner on the contact page',
      category: 'heroes',
      imageUrl: '/restaurant/antipasto-platter.jpeg',
      defaultImageUrl: '/restaurant/antipasto-platter.jpeg',
    }),
    siteImageRepo.create({
      key: 'hero_gift_cards',
      label: 'Gift Cards Page Hero',
      description: 'Banner on the gift cards page',
      category: 'heroes',
      imageUrl: '/restaurant/chocolate-cup-dessert.jpeg',
      defaultImageUrl: '/restaurant/chocolate-cup-dessert.jpeg',
    }),
    // ── Nav tiles ────────────────────────────────────────────────────────────
    siteImageRepo.create({
      key: 'nav_about',
      label: 'About Nav Tile',
      description: 'Navigation tile for about page',
      category: 'nav_tiles',
      imageUrl: '/restaurant/chef-pizza-oven.jpeg',
      defaultImageUrl: '/restaurant/chef-pizza-oven.jpeg',
    }),
    siteImageRepo.create({
      key: 'nav_menus',
      label: 'Menus Nav Tile',
      description: 'Navigation tile for menus page',
      category: 'nav_tiles',
      imageUrl: '/restaurant/gnocchi-tomato-cream.jpeg',
      defaultImageUrl: '/restaurant/gnocchi-tomato-cream.jpeg',
    }),
    siteImageRepo.create({
      key: 'nav_specials',
      label: 'Specials Nav Tile',
      description: 'Navigation tile for specials page',
      category: 'nav_tiles',
      imageUrl: '/restaurant/ravioli-mushroom-spinach.jpeg',
      defaultImageUrl: '/restaurant/ravioli-mushroom-spinach.jpeg',
    }),
    siteImageRepo.create({
      key: 'nav_events',
      label: 'Events Nav Tile',
      description: 'Navigation tile for events page',
      category: 'nav_tiles',
      imageUrl: '/restaurant/menu-spread.jpeg',
      defaultImageUrl: '/restaurant/menu-spread.jpeg',
    }),
    siteImageRepo.create({
      key: 'nav_family_meals',
      label: 'Family Meals Nav Tile',
      description: 'Navigation tile for family meals page',
      category: 'nav_tiles',
      imageUrl: '/restaurant/family-meal-takeout.jpeg',
      defaultImageUrl: '/restaurant/family-meal-takeout.jpeg',
    }),
    siteImageRepo.create({
      key: 'nav_party_menus',
      label: 'Party Menus Nav Tile',
      description: 'Navigation tile for party menus page',
      category: 'nav_tiles',
      imageUrl: '/restaurant/catering-dessert-display.jpeg',
      defaultImageUrl: '/restaurant/catering-dessert-display.jpeg',
    }),
    siteImageRepo.create({
      key: 'nav_gallery',
      label: 'Gallery Nav Tile',
      description: 'Navigation tile for gallery page',
      category: 'nav_tiles',
      imageUrl: '/restaurant/seafood-linguine.jpeg',
      defaultImageUrl: '/restaurant/seafood-linguine.jpeg',
    }),
    siteImageRepo.create({
      key: 'nav_contact',
      label: 'Contact Nav Tile',
      description: 'Navigation tile for contact page',
      category: 'nav_tiles',
      imageUrl: '/restaurant/antipasto-platter.jpeg',
      defaultImageUrl: '/restaurant/antipasto-platter.jpeg',
    }),
    // ── Home page sections ───────────────────────────────────────────────────
    siteImageRepo.create({
      key: 'home_about_owner',
      label: 'Owner Photo',
      description: 'Owner photo in the home about section',
      category: 'home_sections',
      imageUrl: '/restaurant/owner_and_logo.jpg',
      defaultImageUrl: '/restaurant/owner_and_logo.jpg',
    }),
    siteImageRepo.create({
      key: 'home_menu_appetizers',
      label: 'Menu Preview – Appetizers',
      description: 'Appetizers preview card on the home page',
      category: 'home_sections',
      imageUrl: '/restaurant/arancini-tomato.jpeg',
      defaultImageUrl: '/restaurant/arancini-tomato.jpeg',
    }),
    siteImageRepo.create({
      key: 'home_menu_pasta',
      label: 'Menu Preview – Pasta',
      description: 'Pasta preview card on the home page',
      category: 'home_sections',
      imageUrl: '/restaurant/ravioli-mushroom-spinach.jpeg',
      defaultImageUrl: '/restaurant/ravioli-mushroom-spinach.jpeg',
    }),
    siteImageRepo.create({
      key: 'home_menu_pizza',
      label: 'Menu Preview – Pizza',
      description: 'Pizza preview card on the home page',
      category: 'home_sections',
      imageUrl: '/orrdos/pizza-corrados.jpg',
      defaultImageUrl: '/orrdos/pizza-corrados.jpg',
    }),
    siteImageRepo.create({
      key: 'home_menu_mains',
      label: 'Menu Preview – Mains',
      description: 'Mains preview card on the home page',
      category: 'home_sections',
      imageUrl: '/restaurant/beef-short-rib.jpeg',
      defaultImageUrl: '/restaurant/beef-short-rib.jpeg',
    }),
    siteImageRepo.create({
      key: 'home_family_meals_bg',
      label: 'Family Meals Background',
      description: 'Background for the family meals section',
      category: 'home_sections',
      imageUrl: '/restaurant/catering-fruit-platter.jpeg',
      defaultImageUrl: '/restaurant/catering-fruit-platter.jpeg',
    }),
    siteImageRepo.create({
      key: 'home_private_events',
      label: 'Private Events Photo',
      description: 'Photo for the private events section',
      category: 'home_sections',
      imageUrl: '/orrdos/interior-upstairs.jpg',
      defaultImageUrl: '/orrdos/interior-upstairs.jpg',
    }),
    // ── About page sections ──────────────────────────────────────────────────
    siteImageRepo.create({
      key: 'about_heritage',
      label: 'Heritage Image',
      description: 'Heritage section image on the about page',
      category: 'about_sections',
      imageUrl: '/restaurant/menu-spread.jpeg',
      defaultImageUrl: '/restaurant/menu-spread.jpeg',
    }),
    siteImageRepo.create({
      key: 'about_offer_cuisine',
      label: 'Offer – Cuisine',
      description: 'Cuisine card in what we offer section',
      category: 'about_sections',
      imageUrl: '/restaurant/gnocchi-tomato-cream.jpeg',
      defaultImageUrl: '/restaurant/gnocchi-tomato-cream.jpeg',
    }),
    siteImageRepo.create({
      key: 'about_offer_family',
      label: 'Offer – Family',
      description: 'Family card in what we offer section',
      category: 'about_sections',
      imageUrl: '/restaurant/family-meal-takeout.jpeg',
      defaultImageUrl: '/restaurant/family-meal-takeout.jpeg',
    }),
    siteImageRepo.create({
      key: 'about_offer_bar',
      label: 'Offer – Bar & Wine',
      description: 'Bar card in what we offer section',
      category: 'about_sections',
      imageUrl: '/restaurant/valentine-martini.jpeg',
      defaultImageUrl: '/restaurant/valentine-martini.jpeg',
    }),
    siteImageRepo.create({
      key: 'about_offer_events',
      label: 'Offer – Events',
      description: 'Events card in what we offer section',
      category: 'about_sections',
      imageUrl: '/restaurant/catering-dessert-display.jpeg',
      defaultImageUrl: '/restaurant/catering-dessert-display.jpeg',
    }),
    siteImageRepo.create({
      key: 'about_cta',
      label: 'About CTA Image',
      description: 'Call-to-action image at the bottom of about',
      category: 'about_sections',
      imageUrl: '/restaurant/pork-roll-jus.jpeg',
      defaultImageUrl: '/restaurant/pork-roll-jus.jpeg',
    }),
    // ── Gift cards ───────────────────────────────────────────────────────────
    siteImageRepo.create({
      key: 'gift_card_birthday',
      label: 'Gift Card – Birthday',
      description: 'Birthday gift card image',
      category: 'gift_cards',
      imageUrl: '/restaurant/catering-dessert-display.jpeg',
      defaultImageUrl: '/restaurant/catering-dessert-display.jpeg',
    }),
    siteImageRepo.create({
      key: 'gift_card_anniversary',
      label: 'Gift Card – Anniversary',
      description: 'Anniversary gift card image',
      category: 'gift_cards',
      imageUrl: '/restaurant/salmon-beurre-blanc.jpeg',
      defaultImageUrl: '/restaurant/salmon-beurre-blanc.jpeg',
    }),
    siteImageRepo.create({
      key: 'gift_card_holiday',
      label: 'Gift Card – Holiday',
      description: 'Holiday gift card image',
      category: 'gift_cards',
      imageUrl: '/restaurant/tiramisu.jpeg',
      defaultImageUrl: '/restaurant/tiramisu.jpeg',
    }),
    siteImageRepo.create({
      key: 'gift_card_corporate',
      label: 'Gift Card – Corporate',
      description: 'Corporate gift card image',
      category: 'gift_cards',
      imageUrl: '/restaurant/menu-spread.jpeg',
      defaultImageUrl: '/restaurant/menu-spread.jpeg',
    }),
    siteImageRepo.create({
      key: 'gift_card_thank_you',
      label: 'Gift Card – Thank You',
      description: 'Thank you gift card image',
      category: 'gift_cards',
      imageUrl: '/restaurant/burrata-caprese.jpeg',
      defaultImageUrl: '/restaurant/burrata-caprese.jpeg',
    }),
    siteImageRepo.create({
      key: 'gift_card_just_because',
      label: 'Gift Card – Just Because',
      description: 'Just because gift card image',
      category: 'gift_cards',
      imageUrl: '/restaurant/chocolate-lava-cake.jpeg',
      defaultImageUrl: '/restaurant/chocolate-lava-cake.jpeg',
    }),
  ]);

  // ─── Digital menu PDFs ──────────────────────────────────────────────────────
  const digitalMenuRepo = AppDataSource.getRepository(DigitalMenuPdf);
  await digitalMenuRepo.save([
    digitalMenuRepo.create({
      title: 'Main Food Menu',
      description: 'Full dine-in food menu',
      pdfUrl: '/uploads/menus/food-menu.pdf',
      category: DigitalMenuCategory.FOOD,
      sortOrder: 0,
    }),
    digitalMenuRepo.create({
      title: 'Drinks & Cocktails',
      description: 'Bar and cocktail list',
      pdfUrl: '/uploads/menus/drinks-menu.pdf',
      category: DigitalMenuCategory.DRINKS,
      sortOrder: 1,
    }),
  ]);

  // ─── Posters ────────────────────────────────────────────────────────────────
  const posterRepo = AppDataSource.getRepository(Poster);
  await posterRepo.save([
    posterRepo.create({
      imageUrl: '/uploads/posters/trivia-night.jpg',
      title: 'Trivia Night',
      description: 'Every Saturday at 8pm',
      linkUrl: '/events',
      sortOrder: 0,
    }),
    posterRepo.create({
      imageUrl: '/uploads/posters/summer-patio.jpg',
      title: 'Summer Patio Is Open',
      sortOrder: 1,
    }),
  ]);

  await AppDataSource.destroy();
  console.log('✅ Seed complete');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
