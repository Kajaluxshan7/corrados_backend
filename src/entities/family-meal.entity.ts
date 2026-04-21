import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FamilyMealAddon } from './family-meal-addon.entity';

@Entity('family_meals')
export class FamilyMeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Number of people this meal serves, e.g. "4" or "Per Person" */
  @Column({ type: 'varchar', length: 50, default: '4' })
  serves: string;

  /** Base price in CAD */
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  basePrice: number;

  /** Display label appended to price, e.g. "+tax" */
  @Column({ type: 'varchar', length: 50, default: '+tax' })
  priceLabel: string;

  /** 'combo' for family combo packages, 'daily_special' for weekday/weekend specials */
  @Column({ type: 'varchar', length: 50, default: 'combo' })
  mealType: 'combo' | 'daily_special';

  /** Where this meal is available: 'dine_in' | 'take_out' | 'delivery' */
  @Column({ type: 'text', array: true, default: '{}' })
  availableFor: string[];

  /** Included items for this meal, e.g. ["Caesar Salad or Mixed Greens", "2x Cheese Pizza"] */
  @Column({ type: 'text', array: true, default: '{}' })
  items: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'text', array: true, default: '{}' })
  imageUrls: string[];

  @OneToMany(() => FamilyMealAddon, (addon) => addon.familyMeal, {
    cascade: true,
    eager: true,
  })
  addons: FamilyMealAddon[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
