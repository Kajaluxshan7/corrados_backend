import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalMenuPdf } from '../entities/digital-menu-pdf.entity';
import { DigitalMenuService } from './digital-menu.service';
import { DigitalMenuController } from './digital-menu.controller';
import { UploadModule } from '../upload/upload.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DigitalMenuPdf]),
    UploadModule,
    WebSocketModule,
  ],
  controllers: [DigitalMenuController],
  providers: [DigitalMenuService],
  exports: [DigitalMenuService],
})
export class DigitalMenuModule {}
