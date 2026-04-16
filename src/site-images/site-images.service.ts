import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteImage } from '../entities/site-image.entity';

@Injectable()
export class SiteImagesService {
  private readonly logger = new Logger(SiteImagesService.name);

  constructor(
    @InjectRepository(SiteImage)
    private readonly repo: Repository<SiteImage>,
  ) {}

  /**
   * Returns only admin-overridden images as a key→url map.
   * Rows where imageUrl still equals defaultImageUrl are excluded so the
   * frontend falls back to its own hardcoded defaults for those slots.
   */
  async getMap(): Promise<Record<string, string>> {
    const rows = await this.repo.find();
    const map: Record<string, string> = {};
    for (const row of rows) {
      if (row.imageUrl !== row.defaultImageUrl) {
        map[row.key] = row.imageUrl;
      }
    }
    return map;
  }

  /** Returns all rows with full metadata — used by the admin dashboard. */
  async findAll(): Promise<SiteImage[]> {
    return this.repo.find({ order: { category: 'ASC', key: 'ASC' } });
  }

  /** Updates the imageUrl for a single slot by key. */
  async updateByKey(key: string, imageUrl: string): Promise<SiteImage> {
    const record = await this.repo.findOne({ where: { key } });
    if (!record) {
      throw new NotFoundException(`Site image key "${key}" not found`);
    }
    record.imageUrl = imageUrl;
    const saved = await this.repo.save(record);
    this.logger.log(`Site image updated: ${key} → ${imageUrl}`);
    return saved;
  }

  /** Resets the imageUrl back to the defaultImageUrl for a single slot. */
  async resetByKey(key: string): Promise<SiteImage> {
    const record = await this.repo.findOne({ where: { key } });
    if (!record) {
      throw new NotFoundException(`Site image key "${key}" not found`);
    }
    record.imageUrl = record.defaultImageUrl;
    const saved = await this.repo.save(record);
    this.logger.log(`Site image reset to default: ${key}`);
    return saved;
  }
}
