import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../../../core/database/base.entity.js';
import { TripItemOrmEntity } from './trip-item.orm-entity.js';
import { TripOrmEntity } from './trip.orm-entity.js';

@Entity('trip_days')
@Index('IDX_trip_days_trip_day_index_unique', ['tripId', 'dayIndex'], { unique: true })
export class TripDayOrmEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  tripId: string;

  @ManyToOne(() => TripOrmEntity, (trip) => trip.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: TripOrmEntity;

  @Column({ type: 'int' })
  dayIndex: number;

  @Column({ type: 'date' })
  date: string;

  @OneToMany(() => TripItemOrmEntity, (item) => item.tripDay, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  items: TripItemOrmEntity[];
}
