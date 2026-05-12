import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../../../core/database/base.entity.js';
import { TripDayOrmEntity } from './trip-day.orm-entity.js';

@Entity('trip_items')
@Index('IDX_trip_items_day_start_time', ['tripDayId', 'startTime'])
export class TripItemOrmEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  tripDayId: string;

  @ManyToOne(() => TripDayOrmEntity, (tripDay) => tripDay.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripDayId' })
  tripDay: TripDayOrmEntity;

  @Column({ type: 'uuid' })
  placeId: string;

  @Column({ type: 'time without time zone' })
  startTime: string;

  @Column({ type: 'time without time zone' })
  endTime: string;

  @Column({ type: 'varchar', length: 64 })
  type: string;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
