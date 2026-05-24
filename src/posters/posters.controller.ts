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
import {
  PostersService,
  CreatePosterDto,
  UpdatePosterDto,
} from './posters.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posters')
export class PostersController {
  constructor(private readonly service: PostersService) {}

  @Get()
  findActive() {
    return this.service.findActive();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePosterDto) {
    return this.service.create(dto);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  reorder(@Body() body: { ids: string[] }) {
    return this.service.reorder(body.ids);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePosterDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
