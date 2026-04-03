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

export class CreateSectionItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class CreatePartySectionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsIn(['fixed', 'choice', 'family_style', 'variety'])
  sectionType: 'fixed' | 'choice' | 'family_style' | 'variety';

  @IsString()
  @IsOptional()
  instruction?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionItemDto)
  items?: CreateSectionItemDto[];
}

export class CreatePartyMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['cocktail', 'party'])
  menuType: 'cocktail' | 'party';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerPerson: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  minimumGuests?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maximumGuests?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  imageUrls?: string[];

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePartySectionDto)
  sections?: CreatePartySectionDto[];
}
