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
import { PartyMenuService } from './party-menu.service';
import {
  CreatePartyMenuDto,
  CreatePartySectionDto,
  CreateSectionItemDto,
} from './dto/create-party-menu.dto';
import {
  UpdatePartyMenuDto,
  UpdatePartySectionDto,
  UpdateSectionItemDto,
} from './dto/update-party-menu.dto';
import { ReorderDto } from './dto/reorder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('party-menu')
export class PartyMenuController {
  private readonly logger = new Logger(PartyMenuController.name);

  constructor(private readonly partyMenuService: PartyMenuService) {}

  // ─── Party Menus ─────────────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.partyMenuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partyMenuService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePartyMenuDto) {
    return this.partyMenuService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePartyMenuDto) {
    return this.partyMenuService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.partyMenuService.remove(id);
  }

  @Patch(':id/reorder')
  @UseGuards(JwtAuthGuard)
  reorder(@Param('id') id: string, @Body() dto: ReorderDto) {
    return this.partyMenuService.reorder(id, dto.sortOrder);
  }

  // ─── Sections ────────────────────────────────────────────────────────────────

  @Post(':id/sections')
  @UseGuards(JwtAuthGuard)
  createSection(
    @Param('id') partyMenuId: string,
    @Body() dto: CreatePartySectionDto,
  ) {
    return this.partyMenuService.createSection(partyMenuId, dto);
  }

  @Patch('sections/:sectionId')
  @UseGuards(JwtAuthGuard)
  updateSection(
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdatePartySectionDto,
  ) {
    return this.partyMenuService.updateSection(sectionId, dto);
  }

  @Delete('sections/:sectionId')
  @UseGuards(JwtAuthGuard)
  removeSection(@Param('sectionId') sectionId: string) {
    return this.partyMenuService.removeSection(sectionId);
  }

  @Patch('sections/:sectionId/reorder')
  @UseGuards(JwtAuthGuard)
  reorderSection(
    @Param('sectionId') sectionId: string,
    @Body() dto: ReorderDto,
  ) {
    return this.partyMenuService.reorderSection(sectionId, dto.sortOrder);
  }

  // ─── Section Items ───────────────────────────────────────────────────────────

  @Post('sections/:sectionId/items')
  @UseGuards(JwtAuthGuard)
  createItem(
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateSectionItemDto,
  ) {
    return this.partyMenuService.createItem(sectionId, dto);
  }

  @Patch('items/:itemId')
  @UseGuards(JwtAuthGuard)
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateSectionItemDto,
  ) {
    return this.partyMenuService.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  @UseGuards(JwtAuthGuard)
  removeItem(@Param('itemId') itemId: string) {
    return this.partyMenuService.removeItem(itemId);
  }

  @Patch('items/:itemId/reorder')
  @UseGuards(JwtAuthGuard)
  reorderItem(@Param('itemId') itemId: string, @Body() dto: ReorderDto) {
    return this.partyMenuService.reorderItem(itemId, dto.sortOrder);
  }
}
