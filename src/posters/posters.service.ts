import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poster } from '../entities/poster.entity';
import { UploadService } from '../upload/upload.service';
import { AppWebSocketGateway, WsEvent } from '../websocket/websocket.gateway';

export interface CreatePosterDto {
  imageUrl: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePosterDto extends Partial<CreatePosterDto> {}

@Injectable()
export class PostersService {
  constructor(
    @InjectRepository(Poster)
    private readonly repo: Repository<Poster>,
    private readonly uploadService: UploadService,
    private readonly wsGateway: AppWebSocketGateway,
  ) {}

  async findAll(): Promise<Poster[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  async findActive(): Promise<Poster[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Poster> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Poster not found');
    return item;
  }

  async create(dto: CreatePosterDto): Promise<Poster> {
    const item = this.repo.create(dto);
    const saved = await this.repo.save(item);
    this.wsGateway.emitToAll(WsEvent.POSTERS_UPDATED, {
      action: 'created',
    });
    return saved;
  }

  async update(id: string, dto: UpdatePosterDto): Promise<Poster> {
    const item = await this.findById(id);

    if (dto.imageUrl && dto.imageUrl !== item.imageUrl) {
      await this.uploadService.deleteFile(item.imageUrl).catch(() => {});
    }

    Object.assign(item, dto);
    const saved = await this.repo.save(item);
    this.wsGateway.emitToAll(WsEvent.POSTERS_UPDATED, {
      action: 'updated',
    });
    return saved;
  }

  async remove(id: string): Promise<void> {
    const item = await this.findById(id);
    if (item.imageUrl) await this.uploadService.deleteFile(item.imageUrl).catch(() => {});
    await this.repo.remove(item);
    this.wsGateway.emitToAll(WsEvent.POSTERS_UPDATED, {
      action: 'deleted',
    });
  }

  async reorder(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id, index) => this.repo.update(id, { sortOrder: index })),
    );
    this.wsGateway.emitToAll(WsEvent.POSTERS_UPDATED, {
      action: 'reordered',
    });
  }
}
