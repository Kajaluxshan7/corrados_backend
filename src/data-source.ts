import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from './entities/user.entity';
import { MenuItem } from './entities/menu-item.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItemMeasurement } from './entities/menu-item-measurement.entity';
import { MeasurementType } from './entities/measurement-type.entity';
import { PrimaryCategory } from './entities/primary-category.entity';
import { Special } from './entities/special.entity';
import { Event } from './entities/event.entity';
import { OpeningHours } from './entities/opening-hours.entity';
import { Todo } from './entities/todo.entity';
import { Story } from './entities/story.entity';
import { StoryCategory } from './entities/story-category.entity';
import { Subscriber } from './entities/subscriber.entity';
import { ScheduledNotification } from './entities/scheduled-notification.entity';
import { Announcement } from './entities/announcement.entity';
import { PartyMenu } from './entities/party-menu.entity';
import { PartyMenuSection } from './entities/party-menu-section.entity';
import { PartyMenuSectionItem } from './entities/party-menu-section-item.entity';
import { SiteImage } from './entities/site-image.entity';

config();

const configService = new ConfigService();

// Validate required environment variables
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingVars.join(', ')}. ` +
      'Please ensure your .env file is properly configured.',
  );
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.getOrThrow<string>('DB_HOST'),
  port: configService.getOrThrow<number>('DB_PORT'),
  username: configService.getOrThrow<string>('DB_USERNAME'),
  password: configService.getOrThrow<string>('DB_PASSWORD'),
  database: configService.getOrThrow<string>('DB_NAME'),
  entities: [
    User,
    MenuItem,
    MenuCategory,
    MenuItemMeasurement,
    MeasurementType,
    PrimaryCategory,
    Special,
    Event,
    OpeningHours,
    Todo,
    Story,
    StoryCategory,
    Subscriber,
    ScheduledNotification,
    Announcement,
    PartyMenu,
    PartyMenuSection,
    PartyMenuSectionItem,
    SiteImage,
  ],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false, // We'll use migrations instead
  logging: true,
  migrationsRun: false,
});

// If this file is run directly, synchronize the schema
if (require.main === module) {
  AppDataSource.initialize()
    .then(() => {
      Logger.log('📡 Data source initialized');
      return AppDataSource.synchronize();
    })
    .then(() => {
      Logger.log('✅ Schema synchronized successfully');
      process.exit(0);
    })
    .catch((error) => {
      Logger.error('❌ Error synchronizing schema:', error as any);
      process.exit(1);
    });
}
