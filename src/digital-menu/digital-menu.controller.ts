import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DigitalMenuService, CreateDigitalMenuPdfDto, UpdateDigitalMenuPdfDto } from './digital-menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('digital-menu')
export class DigitalMenuController {
  constructor(private readonly service: DigitalMenuService) {}

  @Get()
  findActive() {
    return this.service.findActive();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateDigitalMenuPdfDto) {
    return this.service.create(dto);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  reorder(@Body() body: { ids: string[] }) {
    return this.service.reorder(body.ids);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateDigitalMenuPdfDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
