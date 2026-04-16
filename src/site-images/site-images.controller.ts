import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SiteImagesService } from './site-images.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';
import { WsEvent } from '../websocket/websocket.gateway';

@Controller('site-images')
export class SiteImagesController {
  constructor(
    private readonly siteImagesService: SiteImagesService,
    private readonly wsGateway: AppWebSocketGateway,
  ) {}

  /** Public: returns a flat key→url map for the frontend */
  @Get()
  getMap() {
    return this.siteImagesService.getMap();
  }

  /** Admin: returns all rows with full metadata */
  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.siteImagesService.findAll();
  }

  /** Admin: update the image URL for a given key */
  @Patch(':key')
  @UseGuards(JwtAuthGuard)
  async updateByKey(
    @Param('key') key: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      throw new BadRequestException('imageUrl must be a non-empty string');
    }
    const updated = await this.siteImagesService.updateByKey(
      key,
      imageUrl.trim(),
    );
    this.wsGateway.emitToAll(WsEvent.SITE_IMAGES_UPDATED, { key });
    return updated;
  }

  /** Admin: reset a slot back to its default image */
  @Post(':key/reset')
  @UseGuards(JwtAuthGuard)
  async resetByKey(@Param('key') key: string) {
    const updated = await this.siteImagesService.resetByKey(key);
    this.wsGateway.emitToAll(WsEvent.SITE_IMAGES_UPDATED, { key });
    return updated;
  }
}
