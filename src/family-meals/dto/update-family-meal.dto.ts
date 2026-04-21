import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  CreateFamilyMealDto,
  CreateFamilyMealAddonDto,
} from './create-family-meal.dto';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateFamilyMealAddonDto extends PartialType(
  CreateFamilyMealAddonDto,
) {
  @IsString()
  @IsOptional()
  id?: string;
}

export class UpdateFamilyMealDto extends PartialType(
  OmitType(CreateFamilyMealDto, ['addons'] as const),
) {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateFamilyMealAddonDto)
  addons?: UpdateFamilyMealAddonDto[];
}
