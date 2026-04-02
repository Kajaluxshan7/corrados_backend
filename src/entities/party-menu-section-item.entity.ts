import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PartyMenuSection } from './party-menu-section.entity';

@Entity('party_menu_section_items')
export class PartyMenuSectionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sectionId: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => PartyMenuSection, (section) => section.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sectionId' })
  section: PartyMenuSection;
}
