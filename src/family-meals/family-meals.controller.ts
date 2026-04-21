import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FamilyMealsService } from './family-meals.service';
import { CreateFamilyMealDto } from './dto/create-family-meal.dto';
import { UpdateFamilyMealDto } from './dto/update-family-meal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('family-meals')
export class FamilyMealsController {
  private readonly logger = new Logger(FamilyMealsController.name);

  constructor(private readonly familyMealsService: FamilyMealsService) {}

  /** Public: returns all active family meals */
  @Get()
  findAll() {
    return this.familyMealsService.findActive();
  }

  /** Admin: returns all family meals including inactive */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllAdmin() {
    return this.familyMealsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familyMealsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateFamilyMealDto) {
    return this.familyMealsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateFamilyMealDto) {
    return this.familyMealsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.familyMealsService.remove(id);
  }
}
