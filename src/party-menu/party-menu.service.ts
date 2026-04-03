import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartyMenu } from '../entities/party-menu.entity';
import { PartyMenuSection } from '../entities/party-menu-section.entity';
import { PartyMenuSectionItem } from '../entities/party-menu-section-item.entity';
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
import { AppWebSocketGateway, WsEvent } from '../websocket/websocket.gateway';

@Injectable()
export class PartyMenuService {
  private readonly logger = new Logger(PartyMenuService.name);

  constructor(
    @InjectRepository(PartyMenu)
    private partyMenuRepository: Repository<PartyMenu>,
    @InjectRepository(PartyMenuSection)
    private sectionRepository: Repository<PartyMenuSection>,
    @InjectRepository(PartyMenuSectionItem)
    private itemRepository: Repository<PartyMenuSectionItem>,
    private wsGateway: AppWebSocketGateway,
  ) {}

  // ─── Party Menu CRUD ────────────────────────────────────────────────────────

  async findAll(): Promise<PartyMenu[]> {
    return this.partyMenuRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      relations: ['sections', 'sections.items'],
    });
  }

  async findOne(id: string): Promise<PartyMenu> {
    const menu = await this.partyMenuRepository.findOne({
      where: { id },
      relations: ['sections', 'sections.items'],
    });
    if (!menu) throw new NotFoundException(`Party menu ${id} not found`);
    return menu;
  }

  async create(dto: CreatePartyMenuDto): Promise<PartyMenu> {
    const { sections, ...menuData } = dto;

    const count = await this.partyMenuRepository.count();
    const menu = this.partyMenuRepository.create({
      ...menuData,
      sortOrder: menuData.sortOrder ?? count,
    });
    const saved = await this.partyMenuRepository.save(menu);

    if (sections && sections.length > 0) {
      await this.createSectionsBulk(saved.id, sections);
    }

    const result = await this.findOne(saved.id);
    this.wsGateway.emitToAll(WsEvent.PARTY_MENU_UPDATED, { action: 'created' });
    return result;
  }

  async update(id: string, dto: UpdatePartyMenuDto): Promise<PartyMenu> {
    await this.findOne(id);
    const { sections: _sections, ...menuData } = dto;
    await this.partyMenuRepository.update(id, menuData);
    const updated = await this.findOne(id);
    this.wsGateway.emitToAll(WsEvent.PARTY_MENU_UPDATED, { action: 'updated' });
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.partyMenuRepository.delete(id);
    this.wsGateway.emitToAll(WsEvent.PARTY_MENU_UPDATED, { action: 'deleted' });
  }

  async reorder(id: string, sortOrder: number): Promise<PartyMenu> {
    await this.findOne(id);
    await this.partyMenuRepository.update(id, { sortOrder });
    return this.findOne(id);
  }

  // ─── Section CRUD ────────────────────────────────────────────────────────────

  private async createSectionsBulk(
    partyMenuId: string,
    sections: CreatePartySectionDto[],
  ): Promise<void> {
    for (let i = 0; i < sections.length; i++) {
      const { items, ...sectionData } = sections[i];
      const section = this.sectionRepository.create({
        ...sectionData,
        partyMenuId,
        sortOrder: sectionData.sortOrder ?? i,
      });
      const savedSection = await this.sectionRepository.save(section);
      if (items && items.length > 0) {
        await this.createItemsBulk(savedSection.id, items);
      }
    }
  }

  async findSection(sectionId: string): Promise<PartyMenuSection> {
    const section = await this.sectionRepository.findOne({
      where: { id: sectionId },
      relations: ['items'],
    });
    if (!section) throw new NotFoundException(`Section ${sectionId} not found`);
    return section;
  }

  async createSection(
    partyMenuId: string,
    dto: CreatePartySectionDto,
  ): Promise<PartyMenu> {
    await this.findOne(partyMenuId);
    const { items, ...sectionData } = dto;
    const count = await this.sectionRepository.count({
      where: { partyMenuId },
    });
    const section = this.sectionRepository.create({
      ...sectionData,
      partyMenuId,
      sortOrder: sectionData.sortOrder ?? count,
    });
    const savedSection = await this.sectionRepository.save(section);
    if (items && items.length > 0) {
      await this.createItemsBulk(savedSection.id, items);
    }
    return this.findOne(partyMenuId);
  }

  async updateSection(
    sectionId: string,
    dto: UpdatePartySectionDto,
  ): Promise<PartyMenuSection> {
    const section = await this.findSection(sectionId);
    const { items: _items, ...sectionData } = dto;
    await this.sectionRepository.update(sectionId, sectionData);
    return this.findSection(sectionId);
  }

  async removeSection(sectionId: string): Promise<void> {
    await this.findSection(sectionId);
    await this.sectionRepository.delete(sectionId);
  }

  async reorderSection(
    sectionId: string,
    sortOrder: number,
  ): Promise<PartyMenuSection> {
    await this.findSection(sectionId);
    await this.sectionRepository.update(sectionId, { sortOrder });
    return this.findSection(sectionId);
  }

  // ─── Section Item CRUD ───────────────────────────────────────────────────────

  private async createItemsBulk(
    sectionId: string,
    items: CreateSectionItemDto[],
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const item = this.itemRepository.create({
        ...items[i],
        sectionId,
        sortOrder: items[i].sortOrder ?? i,
      });
      await this.itemRepository.save(item);
    }
  }

  async findItem(itemId: string): Promise<PartyMenuSectionItem> {
    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Item ${itemId} not found`);
    return item;
  }

  async createItem(
    sectionId: string,
    dto: CreateSectionItemDto,
  ): Promise<PartyMenuSection> {
    await this.findSection(sectionId);
    const count = await this.itemRepository.count({ where: { sectionId } });
    const item = this.itemRepository.create({
      ...dto,
      sectionId,
      sortOrder: dto.sortOrder ?? count,
    });
    await this.itemRepository.save(item);
    return this.findSection(sectionId);
  }

  async updateItem(
    itemId: string,
    dto: UpdateSectionItemDto,
  ): Promise<PartyMenuSectionItem> {
    await this.findItem(itemId);
    await this.itemRepository.update(itemId, dto);
    return this.findItem(itemId);
  }

  async removeItem(itemId: string): Promise<void> {
    await this.findItem(itemId);
    await this.itemRepository.delete(itemId);
  }

  async reorderItem(
    itemId: string,
    sortOrder: number,
  ): Promise<PartyMenuSectionItem> {
    await this.findItem(itemId);
    await this.itemRepository.update(itemId, { sortOrder });
    return this.findItem(itemId);
  }
}
