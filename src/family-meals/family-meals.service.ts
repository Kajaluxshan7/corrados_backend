import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMeal } from '../entities/family-meal.entity';
import { FamilyMealAddon } from '../entities/family-meal-addon.entity';
import { CreateFamilyMealDto } from './dto/create-family-meal.dto';
import { UpdateFamilyMealDto } from './dto/update-family-meal.dto';
import { AppWebSocketGateway, WsEvent } from '../websocket/websocket.gateway';

@Injectable()
export class FamilyMealsService {
  private readonly logger = new Logger(FamilyMealsService.name);

  constructor(
    @InjectRepository(FamilyMeal)
    private familyMealRepository: Repository<FamilyMeal>,
    @InjectRepository(FamilyMealAddon)
    private addonRepository: Repository<FamilyMealAddon>,
    private wsGateway: AppWebSocketGateway,
  ) {}

  async findAll(): Promise<FamilyMeal[]> {
    return this.familyMealRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findActive(): Promise<FamilyMeal[]> {
    return this.familyMealRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<FamilyMeal> {
    const meal = await this.familyMealRepository.findOne({ where: { id } });
    if (!meal) {
      throw new NotFoundException(`Family meal with ID "${id}" not found`);
    }
    return meal;
  }

  async create(dto: CreateFamilyMealDto): Promise<FamilyMeal> {
    const { addons: addonDtos, ...mealData } = dto;

    const meal = this.familyMealRepository.create(mealData);
    const savedMeal = await this.familyMealRepository.save(meal);

    if (addonDtos && addonDtos.length > 0) {
      const addons = addonDtos.map((a, idx) =>
        this.addonRepository.create({
          ...a,
          familyMealId: savedMeal.id,
          sortOrder: a.sortOrder ?? idx,
        }),
      );
      await this.addonRepository.save(addons);
    }

    const result = await this.findOne(savedMeal.id);
    this.wsGateway.emitToAll(WsEvent.FAMILY_MEAL_UPDATED, {
      action: 'created',
      id: result.id,
    });
    this.wsGateway.emitToAdmins(WsEvent.DASHBOARD_REFRESH, {
      type: 'familyMeals',
    });

    this.logger.log(`Created family meal: ${result.name}`);
    return result;
  }

  async update(id: string, dto: UpdateFamilyMealDto): Promise<FamilyMeal> {
    const meal = await this.findOne(id);
    const { addons: addonDtos, ...mealData } = dto;

    await this.familyMealRepository.save({ ...meal, ...mealData });

    // Replace addons if provided
    if (addonDtos !== undefined) {
      await this.addonRepository.delete({ familyMealId: id });
      if (addonDtos.length > 0) {
        const addons = addonDtos.map((a, idx) =>
          this.addonRepository.create({
            name: a.name ?? '',
            price: a.price ?? 0,
            isAvailable: a.isAvailable ?? true,
            sortOrder: a.sortOrder ?? idx,
            familyMealId: id,
          }),
        );
        await this.addonRepository.save(addons);
      }
    }

    const result = await this.findOne(id);
    this.wsGateway.emitToAll(WsEvent.FAMILY_MEAL_UPDATED, {
      action: 'updated',
      id: result.id,
    });
    this.wsGateway.emitToAdmins(WsEvent.DASHBOARD_REFRESH, {
      type: 'familyMeals',
    });

    this.logger.log(`Updated family meal: ${result.name}`);
    return result;
  }

  async remove(id: string): Promise<void> {
    const meal = await this.findOne(id);
    await this.familyMealRepository.remove(meal);

    this.wsGateway.emitToAll(WsEvent.FAMILY_MEAL_UPDATED, {
      action: 'deleted',
      id,
    });
    this.wsGateway.emitToAdmins(WsEvent.DASHBOARD_REFRESH, {
      type: 'familyMeals',
    });

    this.logger.log(`Deleted family meal: ${meal.name}`);
  }
}
