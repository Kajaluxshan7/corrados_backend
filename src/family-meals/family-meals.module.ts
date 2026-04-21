import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyMealsService } from './family-meals.service';
import { FamilyMealsController } from './family-meals.controller';
import { FamilyMeal } from '../entities/family-meal.entity';
import { FamilyMealAddon } from '../entities/family-meal-addon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FamilyMeal, FamilyMealAddon])],
  controllers: [FamilyMealsController],
  providers: [FamilyMealsService],
  exports: [FamilyMealsService],
})
export class FamilyMealsModule {}
