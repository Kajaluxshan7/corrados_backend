import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MenuCategory } from '../entities/menu-category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemMeasurement } from '../entities/menu-item-measurement.entity';
import { PrimaryCategory } from '../entities/primary-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreatePrimaryCategoryDto } from './dto/create-primary-category.dto';
import { UpdatePrimaryCategoryDto } from './dto/update-primary-category.dto';
import { UploadService } from '../upload/upload.service';
import { AppWebSocketGateway, WsEvent } from '../websocket/websocket.gateway';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);
  constructor(
    @InjectRepository(MenuCategory)
    private categoryRepository: Repository<MenuCategory>,
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
    @InjectRepository(MenuItemMeasurement)
    private measurementRepository: Repository<MenuItemMeasurement>,
    @InjectRepository(PrimaryCategory)
    private primaryCategoryRepository: Repository<PrimaryCategory>,
    private uploadService: UploadService,
    private dataSource: DataSource,
    private wsGateway: AppWebSocketGateway,
  ) {}

  // Primary Category methods
  async findAllPrimaryCategories(): Promise<PrimaryCategory[]> {
    return this.primaryCategoryRepository.find({
      order: { sortOrder: 'ASC' },
      relations: ['categories'],
    });
  }

  async findPrimaryCategoryById(id: string): Promise<PrimaryCategory> {
    const primaryCategory = await this.primaryCategoryRepository.findOne({
      where: { id },
      relations: ['categories'],
    });
    if (!primaryCategory) {
      throw new NotFoundException(`Primary category with ID ${id} not found`);
    }
    return primaryCategory;
  }

  async createPrimaryCategory(
    createPrimaryCategoryDto: CreatePrimaryCategoryDto,
  ): Promise<PrimaryCategory> {
    const primaryCategory = this.primaryCategoryRepository.create(
      createPrimaryCategoryDto,
    );
    const saved = await this.primaryCategoryRepository.save(primaryCategory);
    this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
      action: 'primaryCategory:created',
    });
    return saved;
  }

  async updatePrimaryCategory(
    id: string,
    updatePrimaryCategoryDto: UpdatePrimaryCategoryDto,
  ): Promise<PrimaryCategory> {
    await this.primaryCategoryRepository.update(id, updatePrimaryCategoryDto);
    const updated = await this.findPrimaryCategoryById(id);
    this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
      action: 'primaryCategory:updated',
    });
    return updated;
  }

  async removePrimaryCategory(id: string): Promise<void> {
    await this.primaryCategoryRepository.delete(id);
    this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
      action: 'primaryCategory:deleted',
    });
    this.wsGateway.emitToAdmins(WsEvent.DASHBOARD_REFRESH, { type: 'menu' });
  }

  async movePrimaryCategoryOrder(
    primaryCategoryId: string,
    direction: 'up' | 'down',
  ): Promise<PrimaryCategory> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PrimaryCategory);
      const primaryCategory = await repo.findOne({
        where: { id: primaryCategoryId },
      });
      if (!primaryCategory)
        throw new NotFoundException('Primary category not found');

      const currentOrder = primaryCategory.sortOrder;

      if (direction === 'up' && currentOrder > 0) {
        const previousPrimaryCategory = await repo.findOne({
          where: { sortOrder: currentOrder - 1 },
        });

        if (previousPrimaryCategory) {
          previousPrimaryCategory.sortOrder = currentOrder;
          primaryCategory.sortOrder = currentOrder - 1;

          await repo.save(previousPrimaryCategory);
          const saved = await repo.save(primaryCategory);
          this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
            action: 'primaryCategory:reordered',
          });
          return saved;
        }
      } else if (direction === 'down') {
        const nextPrimaryCategory = await repo.findOne({
          where: { sortOrder: currentOrder + 1 },
        });

        if (nextPrimaryCategory) {
          nextPrimaryCategory.sortOrder = currentOrder;
          primaryCategory.sortOrder = currentOrder + 1;

          await repo.save(nextPrimaryCategory);
          const saved = await repo.save(primaryCategory);
          this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
            action: 'primaryCategory:reordered',
          });
          return saved;
        }
      }

      return primaryCategory;
    });
  }

  // Category methods
  async findAllCategories(primaryCategoryId?: string): Promise<MenuCategory[]> {
    return this.categoryRepository.find({
      where: primaryCategoryId
        ? { primaryCategory: { id: primaryCategoryId } }
        : undefined,
      order: { sortOrder: 'ASC' },
      relations: ['menuItems', 'primaryCategory'],
    });
  }

  async findCategoryById(id: string): Promise<MenuCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['menuItems', 'primaryCategory'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<MenuCategory> {
    const category = this.categoryRepository.create(createCategoryDto);
    const saved = await this.categoryRepository.save(category);
    this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
      action: 'category:created',
    });
    return saved;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<MenuCategory> {
    await this.categoryRepository.update(id, updateCategoryDto);
    const updated = await this.findCategoryById(id);
    this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
      action: 'category:updated',
    });
    return updated;
  }

  async removeCategory(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
    this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
      action: 'category:deleted',
    });
    this.wsGateway.emitToAdmins(WsEvent.DASHBOARD_REFRESH, { type: 'menu' });
  }

  async reorderCategory(
    categoryId: string,
    newOrder: number,
  ): Promise<MenuCategory> {
    const category = await this.findCategoryById(categoryId);
    const oldOrder = category.sortOrder;

    // Get all categories
    const categories = await this.categoryRepository.find({
      order: { sortOrder: 'ASC' },
    });

    // Update sort orders
    if (newOrder > oldOrder) {
      // Moving down
      for (const cat of categories) {
        if (cat.sortOrder > oldOrder && cat.sortOrder <= newOrder) {
          cat.sortOrder--;
          await this.categoryRepository.save(cat);
        }
      }
    } else if (newOrder < oldOrder) {
      // Moving up
      for (const cat of categories) {
        if (cat.sortOrder >= newOrder && cat.sortOrder < oldOrder) {
          cat.sortOrder++;
          await this.categoryRepository.save(cat);
        }
      }
    }

    category.sortOrder = newOrder;
    const saved = await this.categoryRepository.save(category);
    this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
      action: 'category:reordered',
    });
    return saved;
  }

  async moveCategoryOrder(
    categoryId: string,
    direction: 'up' | 'down',
  ): Promise<MenuCategory> {
    const category = await this.findCategoryById(categoryId);
    const currentOrder = category.sortOrder;

    if (direction === 'up' && currentOrder > 0) {
      // Find the category with the previous order
      const previousCategory = await this.categoryRepository.findOne({
        where: { sortOrder: currentOrder - 1 },
      });

      if (previousCategory) {
        // Swap orders
        previousCategory.sortOrder = currentOrder;
        category.sortOrder = currentOrder - 1;

        await this.categoryRepository.save(previousCategory);
        const saved = await this.categoryRepository.save(category);
        this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
          action: 'category:reordered',
        });
        return saved;
      }
    } else if (direction === 'down') {
      // Find the category with the next order
      const nextCategory = await this.categoryRepository.findOne({
        where: { sortOrder: currentOrder + 1 },
      });

      if (nextCategory) {
        // Swap orders
        nextCategory.sortOrder = currentOrder;
        category.sortOrder = currentOrder + 1;

        await this.categoryRepository.save(nextCategory);
        const saved = await this.categoryRepository.save(category);
        this.wsGateway.emitToAll(WsEvent.MENU_UPDATED, {
          action: 'category:reordered',
        });
        return saved;
      }
    }

    return category;
  }

  // Menu Item methods
  async findAllMenuItems(): Promise<MenuItem[]> {
    return this.menuItemRepository.find({
      order: { sortOrder: 'ASC' },
      relations: [
        'category',
        'measurements',
        'measurements.measurementTypeEntity',
      ],
    });
  }

  async findMenuItemById(id: string): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id },
      relations: [
        'category',
        'measurements',
        'measurements.measurementTypeEntity',
      ],
    });
    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }
    return menuItem;
  }

  async findMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    return this.menuItemRepository.find({
      where: { categoryId },
      order: { sortOrder: 'ASC' },
      relations: ['category', 'measurements', 'measurements.measurementTypeEntity'],
    });
  }

  async createMenuItem(
    createMenuItemDto: CreateMenuItemDto,
  ): Promise<MenuItem> {
    const { measurements, ...menuItemData } = createMenuItemDto;

    // Create the menu item
    const menuItem = this.menuItemRepository.create(menuItemData);
    const savedMenuItem = await this.menuItemRepository.save(menuItem);

    // Create measurements if provided
    if (measurements && measurements.length > 0) {
      const measurementEntities = measurements.map((m, index) => {
        return this.measurementRepository.create({
          ...m,
          menuItemId: savedMenuItem.id,
          sortOrder: m.sortOrder ?? index,
        });
      });
      await this.measurementRepository.save(measurementEntities);
    }

    const result = await this.findMenuItemById(savedMenuItem.id);
    this.wsGateway.emitToAll(WsEvent.MENU_ITEM_CREATED, result);
    this.wsGateway.emitToAdmins(WsEvent.DASHBOARD_REFRESH, { type: 'menu' });
    return result;
  }

  async updateMenuItem(
    id: string,
    updateMenuItemDto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    const { measurements, ...menuItemData } = updateMenuItemDto;

    // Update the menu item
    await this.menuItemRepository.update(id, menuItemData);

    // Handle measurements update if provided
    if (measurements !== undefined) {
      // Delete existing measurements
      await this.measurementRepository.delete({ menuItemId: id });

      // Create new measurements if provided
      if (measurements.length > 0) {
        const measurementEntities = measurements.map((m, index) => {
          return this.measurementRepository.create({
            ...m,
            menuItemId: id,
            sortOrder: m.sortOrder ?? index,
          });
        });
        await this.measurementRepository.save(measurementEntities);
      }
    }

    const result = await this.findMenuItemById(id);
    this.wsGateway.emitToAll(WsEvent.MENU_ITEM_UPDATED, result);
    return result;
  }

  async removeMenuItem(id: string): Promise<void> {
    // Get the menu item to access its images before deletion
    const menuItem = await this.findMenuItemById(id);

    // Delete images from S3 if they exist
    if (menuItem.imageUrls && menuItem.imageUrls.length > 0) {
      try {
        await this.uploadService.deleteMultipleFiles(menuItem.imageUrls);
      } catch (error) {
        this.logger.error('Failed to delete images from S3:', error);
        // Continue with menu item deletion even if S3 deletion fails
      }
    }

    await this.menuItemRepository.delete(id);
    this.wsGateway.emitToAll(WsEvent.MENU_ITEM_DELETED, { id });
    this.wsGateway.emitToAdmins(WsEvent.DASHBOARD_REFRESH, { type: 'menu' });
  }

  async reorderMenuItem(itemId: string, newOrder: number): Promise<MenuItem> {
    const menuItem = await this.findMenuItemById(itemId);
    const oldOrder = menuItem.sortOrder;

    // Get all menu items in the same category
    const menuItems = await this.menuItemRepository.find({
      where: { categoryId: menuItem.categoryId },
      order: { sortOrder: 'ASC' },
    });

    // Update sort orders
    if (newOrder > oldOrder) {
      // Moving down
      for (const item of menuItems) {
        if (item.sortOrder > oldOrder && item.sortOrder <= newOrder) {
          item.sortOrder--;
          await this.menuItemRepository.save(item);
        }
      }
    } else if (newOrder < oldOrder) {
      // Moving up
      for (const item of menuItems) {
        if (item.sortOrder >= newOrder && item.sortOrder < oldOrder) {
          item.sortOrder++;
          await this.menuItemRepository.save(item);
        }
      }
    }

    menuItem.sortOrder = newOrder;
    return this.menuItemRepository.save(menuItem);
  }

  async moveMenuItemOrder(
    itemId: string,
    direction: 'up' | 'down',
  ): Promise<MenuItem> {
    const menuItem = await this.findMenuItemById(itemId);
    const currentOrder = menuItem.sortOrder;

    if (direction === 'up' && currentOrder > 0) {
      // Find the menu item with the previous order in the same category
      const previousItem = await this.menuItemRepository.findOne({
        where: {
          categoryId: menuItem.categoryId,
          sortOrder: currentOrder - 1,
        },
      });

      if (previousItem) {
        // Swap orders
        previousItem.sortOrder = currentOrder;
        menuItem.sortOrder = currentOrder - 1;

        await this.menuItemRepository.save(previousItem);
        return this.menuItemRepository.save(menuItem);
      }
    } else if (direction === 'down') {
      // Find the menu item with the next order in the same category
      const nextItem = await this.menuItemRepository.findOne({
        where: {
          categoryId: menuItem.categoryId,
          sortOrder: currentOrder + 1,
        },
      });

      if (nextItem) {
        // Swap orders
        nextItem.sortOrder = currentOrder;
        menuItem.sortOrder = currentOrder + 1;

        await this.menuItemRepository.save(nextItem);
        return this.menuItemRepository.save(menuItem);
      }
    }

    return menuItem;
  }
}
