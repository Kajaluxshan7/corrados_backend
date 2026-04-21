import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FamilyMeal } from './family-meal.entity';

@Entity('family_meal_addons')
export class FamilyMealAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FamilyMeal, (meal) => meal.addons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyMealId' })
  familyMeal: FamilyMeal;

  @Column({ type: 'uuid' })
  familyMealId: string;

  /** Add-on display name, e.g. "Add Garlic Bread (4 Pieces)" */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** Additional price for this add-on in CAD */
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
