import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EventType {
  LIVE_MUSIC = 'live_music',
  SPORTS_VIEWING = 'sports_viewing',
  TRIVIA_NIGHT = 'trivia_night',
  KARAOKE = 'karaoke',
  PRIVATE_PARTY = 'private_party',
  SPECIAL_EVENT = 'special_event',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Index()
  @Column({
    type: 'enum',
    enum: EventType,
    default: EventType.SPECIAL_EVENT,
  })
  type: EventType;

  @Column({ type: 'timestamptz' })
  displayStartDate: Date;

  @Column({ type: 'timestamptz' })
  displayEndDate: Date;

  @Index()
  @Column({ type: 'timestamptz' })
  eventStartDate: Date;

  @Column({ type: 'timestamptz' })
  eventEndDate: Date;

  @Index()
  @Column({ default: true })
  isActive: boolean;

  @Column('json', { nullable: true })
  imageUrls: string[];

  @Column({ nullable: true })
  ticketLink: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
