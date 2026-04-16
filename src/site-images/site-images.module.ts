import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteImage } from '../entities/site-image.entity';
import { SiteImagesService } from './site-images.service';
import { SiteImagesController } from './site-images.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteImage])],
  controllers: [SiteImagesController],
  providers: [SiteImagesService],
  exports: [SiteImagesService],
})
export class SiteImagesModule {}
