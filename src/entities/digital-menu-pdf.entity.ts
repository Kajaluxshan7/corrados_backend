import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DigitalMenuCategory {
  FOOD = 'food',
  DRINKS = 'drinks',
  WINE = 'wine',
  COCKTAILS = 'cocktails',
  DESSERTS = 'desserts',
  SPECIALS = 'specials',
  OTHER = 'other',
}

@Entity('digital_menu_pdfs')
export class DigitalMenuPdf {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  pdfUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({
    type: 'enum',
    enum: DigitalMenuCategory,
    default: DigitalMenuCategory.FOOD,
  })
  category: DigitalMenuCategory;

  @Index()
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
