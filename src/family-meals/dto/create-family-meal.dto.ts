import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  Min,
  ValidateNested,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFamilyMealAddonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class CreateFamilyMealDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  serves?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice: number;

  @IsString()
  @IsOptional()
  priceLabel?: string;

  @IsString()
  @IsIn(['combo', 'daily_special'])
  @IsOptional()
  mealType?: 'combo' | 'daily_special';

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  availableFor?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  items?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  imageUrls?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFamilyMealAddonDto)
  addons?: CreateFamilyMealAddonDto[];
}
