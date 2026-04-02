import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PartyMenuSection } from './party-menu-section.entity';

export type PartyMenuType = 'cocktail' | 'party';

@Entity('party_menus')
export class PartyMenu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'party' })
  menuType: PartyMenuType;

  @Column('decimal', {
    precision: 8,
    scale: 2,
    transformer: {
      to: (value: number) =>
        value === null || value === undefined ? null : value,
      from: (value: string) =>
        value === null || value === undefined ? null : parseFloat(value),
    },
  })
  pricePerPerson: number;

  @Column({ nullable: true })
  minimumGuests: number;

  @Column({ nullable: true })
  maximumGuests: number;

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => PartyMenuSection, (section) => section.partyMenu, {
    cascade: true,
    eager: false,
  })
  sections: PartyMenuSection[];
}
