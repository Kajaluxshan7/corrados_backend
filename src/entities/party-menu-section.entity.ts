import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PartyMenu } from './party-menu.entity';
import { PartyMenuSectionItem } from './party-menu-section-item.entity';

export type SectionType = 'fixed' | 'choice' | 'family_style' | 'variety';

@Entity('party_menu_sections')
export class PartyMenuSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  partyMenuId: string;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'varchar', default: 'fixed' })
  sectionType: SectionType;

  @Column({ nullable: true })
  instruction: string;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => PartyMenu, (pm) => pm.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partyMenuId' })
  partyMenu: PartyMenu;

  @OneToMany(() => PartyMenuSectionItem, (item) => item.section, {
    cascade: true,
    eager: false,
  })
  items: PartyMenuSectionItem[];
}
