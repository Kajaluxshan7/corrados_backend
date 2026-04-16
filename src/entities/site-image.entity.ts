import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Stores the editable "default" images used across the public-facing frontend.
 * Each row represents one named image slot (e.g. hero_about, nav_menus, …).
 * The `imageUrl` can be an uploaded /uploads/… path or a public /restaurant/… path.
 */
@Entity('site_images')
export class SiteImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stable machine identifier — never changes after creation (e.g. "hero_about"). */
  @Column({ unique: true })
  key: string;

  /** Human-readable label shown in the admin panel (e.g. "About Page Hero"). */
  @Column()
  label: string;

  /** Brief description of where this image appears. */
  @Column({ nullable: true })
  description: string;

  /** Grouping for the admin UI (e.g. "heroes", "nav_tiles", "family_meals", "about"). */
  @Column()
  category: string;

  /**
   * Current image URL.  May be:
   *  - a public-folder path:  /restaurant/owner_and_logo.jpg
   *  - an uploaded file path: /uploads/site-images/uuid-foo.jpg
   *  - an absolute URL:       https://cdn.example.com/…
   */
  @Column()
  imageUrl: string;

  /** The built-in fallback path from the public folder (read-only reference). */
  @Column()
  defaultImageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
