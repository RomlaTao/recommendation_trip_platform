import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../../../core/database/base.entity.js';
import { TripStatus } from '../../../domain/enums/trip-status.enum.js';
import { TripDayOrmEntity } from './trip-day.orm-entity.js';

@Entity('trips')
@Index('IDX_trips_user_status_start_date', ['userId', 'status', 'startDate'])
export class TripOrmEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', length: 32 })
  status: TripStatus;

  @Column({ type: 'int', default: 0 })
  version: number;

  @OneToMany(() => TripDayOrmEntity, (day) => day.trip, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  days: TripDayOrmEntity[];
}
