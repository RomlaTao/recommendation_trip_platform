import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * DDD Foundation — Base Entity
 *
 * Design rationale:
 * - All domain entities (User, Trip, Itinerary, …) extend this abstract class
 *   to get a consistent primary key strategy (UUID v4) and audit timestamps.
 * - UUID over auto-increment integers: avoids sequential enumeration attacks,
 *   works well in distributed/multi-DB setups, and is portable across services.
 * - `deletedAt` enables soft-delete via TypeORM's `@SoftDelete()` behaviour.
 *   Entities are never physically removed; they are tombstoned, which preserves
 *   audit trails and referential integrity for trip history.
 * - This class is intentionally framework-agnostic at the TypeScript level
 *   (just decorators + properties) — easy to test and mock.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /**
   * Soft-delete timestamp. When set, TypeORM automatically filters this record
   * out of standard queries (requires `softDelete` / `restore` methods or
   * `withDeleted()` to access tombstoned rows).
   */

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
