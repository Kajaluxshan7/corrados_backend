import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Poster } from '../entities/poster.entity';
import { PostersService } from './posters.service';
import { PostersController } from './posters.controller';
import { UploadModule } from '../upload/upload.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [TypeOrmModule.forFeature([Poster]), UploadModule, WebSocketModule],
  controllers: [PostersController],
  providers: [PostersService],
  exports: [PostersService],
})
export class PostersModule {}
