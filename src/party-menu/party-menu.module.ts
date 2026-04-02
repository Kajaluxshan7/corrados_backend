import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartyMenuService } from './party-menu.service';
import { PartyMenuController } from './party-menu.controller';
import { PartyMenu } from '../entities/party-menu.entity';
import { PartyMenuSection } from '../entities/party-menu-section.entity';
import { PartyMenuSectionItem } from '../entities/party-menu-section-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PartyMenu,
      PartyMenuSection,
      PartyMenuSectionItem,
    ]),
  ],
  controllers: [PartyMenuController],
  providers: [PartyMenuService],
  exports: [PartyMenuService],
})
export class PartyMenuModule {}
