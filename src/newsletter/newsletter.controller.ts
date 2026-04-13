import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto, GetSubscribersQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  // ─── Public Endpoints ─────────────────────────────────────────

  @Post('subscribe')
  subscribe(@Body() subscribeDto: SubscribeDto) {
    return this.newsletterService.subscribe(subscribeDto);
  }

  @Get('unsubscribe')
  unsubscribe(@Query('token') token: string) {
    return this.newsletterService.unsubscribe(token);
  }

  // ─── Admin Endpoints (Protected) ─────────────────────────────

  @Get('subscribers')
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: GetSubscribersQueryDto) {
    return this.newsletterService.findAll(query);
  }

  @Get('subscribers/active')
  @UseGuards(JwtAuthGuard)
  findActive() {
    return this.newsletterService.findActive();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.newsletterService.getStats();
  }

  @Get('subscribers/export')
  @UseGuards(JwtAuthGuard)
  async exportPdf(
    @Query('status') status: string = 'all',
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.newsletterService.exportSubscribersPdf(status);
    const filename = `subscribers-${status}-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Post('subscribers/:id/send-promo')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  sendPromoCode(@Param('id') id: string) {
    return this.newsletterService.sendPromoCode(id);
  }

  @Patch('subscribers/:id/claim-promo')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  markPromoClaimed(@Param('id') id: string) {
    return this.newsletterService.markPromoClaimed(id);
  }

  @Delete('subscribers/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.newsletterService.remove(id);
  }
}
