import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { SpecialsModule } from './specials/specials.module';
import { OpeningHoursModule } from './opening-hours/opening-hours.module';
import { EventsModule } from './events/events.module';
import { UsersModule } from './users/users.module';
import { TodosModule } from './todos/todos.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { MeasurementModule } from './measurements/measurement.module';
import { StoriesModule } from './stories/stories.module';
import { ContactModule } from './contact/contact.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { PartyMenuModule } from './party-menu/party-menu.module';
import { FamilyMealsModule } from './family-meals/family-meals.module';
import { WebSocketModule } from './websocket/websocket.module';
import { HealthModule } from './health/health.module';
import { PartyMenu } from './entities/party-menu.entity';
import { FamilyMeal } from './entities/family-meal.entity';
import { FamilyMealAddon } from './entities/family-meal-addon.entity';
import { SiteImage } from './entities/site-image.entity';
import { SiteImagesModule } from './site-images/site-images.module';
import { PartyMenuSection } from './entities/party-menu-section.entity';
import { PartyMenuSectionItem } from './entities/party-menu-section-item.entity';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    WebSocketModule,
    HealthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.getOrThrow<string>('DB_HOST'),
          port: configService.getOrThrow<number>('DB_PORT'),
          username: configService.getOrThrow<string>('DB_USERNAME'),
          password: configService.getOrThrow<string>('DB_PASSWORD'),
          database: configService.getOrThrow<string>('DB_NAME'),
          entities: [
            User,
            MenuItem,
            MenuItemMeasurement,
            MeasurementType,
            MenuCategory,
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
            FamilyMeal,
            FamilyMealAddon,
            SiteImage,
          ],
          synchronize:
            configService.getOrThrow<string>('NODE_ENV') !== 'production',
          logging:
            configService.getOrThrow<string>('NODE_ENV') === 'development',
          timezone: 'UTC',
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    MenuModule,
    SpecialsModule,
    OpeningHoursModule,
    EventsModule,
    UsersModule,
    TodosModule,
    DashboardModule,
    UploadModule,
    MeasurementModule,
    StoriesModule,
    ContactModule,
    NewsletterModule,
    NotificationsModule,
    AnnouncementsModule,
    PartyMenuModule,
    FamilyMealsModule,
    SiteImagesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
