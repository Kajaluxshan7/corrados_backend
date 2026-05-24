import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DigitalMenuPdf,
  DigitalMenuCategory,
} from '../entities/digital-menu-pdf.entity';
import { UploadService } from '../upload/upload.service';
import { AppWebSocketGateway, WsEvent } from '../websocket/websocket.gateway';

export interface CreateDigitalMenuPdfDto {
  title: string;
  description?: string;
  pdfUrl: string;
  thumbnailUrl?: string;
  category?: DigitalMenuCategory;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateDigitalMenuPdfDto = Partial<CreateDigitalMenuPdfDto>;

@Injectable()
export class DigitalMenuService {
  constructor(
    @InjectRepository(DigitalMenuPdf)
    private readonly repo: Repository<DigitalMenuPdf>,
    private readonly uploadService: UploadService,
    private readonly wsGateway: AppWebSocketGateway,
  ) {}

  async findAll(): Promise<DigitalMenuPdf[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  async findActive(): Promise<DigitalMenuPdf[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<DigitalMenuPdf> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Digital menu PDF not found');
    return item;
  }

  async create(dto: CreateDigitalMenuPdfDto): Promise<DigitalMenuPdf> {
    const item = this.repo.create(dto);
    const saved = await this.repo.save(item);
    this.wsGateway.emitToAll(WsEvent.DIGITAL_MENU_UPDATED, {
      action: 'created',
    });
    return saved;
  }

  async update(
    id: string,
    dto: UpdateDigitalMenuPdfDto,
  ): Promise<DigitalMenuPdf> {
    const item = await this.findById(id);

    // Clean up old PDF if URL changed
    if (dto.pdfUrl && dto.pdfUrl !== item.pdfUrl) {
      await this.uploadService.deleteFile(item.pdfUrl).catch(() => {});
    }
    if (
      dto.thumbnailUrl &&
      dto.thumbnailUrl !== item.thumbnailUrl &&
      item.thumbnailUrl
    ) {
      await this.uploadService.deleteFile(item.thumbnailUrl).catch(() => {});
    }

    Object.assign(item, dto);
    const saved = await this.repo.save(item);
    this.wsGateway.emitToAll(WsEvent.DIGITAL_MENU_UPDATED, {
      action: 'updated',
    });
    return saved;
  }

  async remove(id: string): Promise<void> {
    const item = await this.findById(id);
    if (item.pdfUrl)
      await this.uploadService.deleteFile(item.pdfUrl).catch(() => {});
    if (item.thumbnailUrl)
      await this.uploadService.deleteFile(item.thumbnailUrl).catch(() => {});
    await this.repo.remove(item);
    this.wsGateway.emitToAll(WsEvent.DIGITAL_MENU_UPDATED, {
      action: 'deleted',
    });
  }

  async reorder(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id, index) => this.repo.update(id, { sortOrder: index })),
    );
    this.wsGateway.emitToAll(WsEvent.DIGITAL_MENU_UPDATED, {
      action: 'reordered',
    });
  }
}
