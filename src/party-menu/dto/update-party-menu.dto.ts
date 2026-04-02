import { PartialType } from '@nestjs/mapped-types';
import {
  CreatePartyMenuDto,
  CreatePartySectionDto,
  CreateSectionItemDto,
} from './create-party-menu.dto';

export class UpdatePartyMenuDto extends PartialType(CreatePartyMenuDto) {}
export class UpdatePartySectionDto extends PartialType(CreatePartySectionDto) {}
export class UpdateSectionItemDto extends PartialType(CreateSectionItemDto) {}
