import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../../../core/database/base.entity.js';
import { DestinationOrmEntity } from '../../../../place/management/infrastructure/persistence/typeorm/destination.orm-entity.js';
import { TripStatus } from '../../../domain/enums/trip-status.enum.js';
import { TripDayOrmEntity } from './trip-day.orm-entity.js';

@Entity('trips')
@Index('IDX_trips_user_status_start_date', ['userId', 'status', 'startDate'])
export class TripOrmEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Index('IDX_trips_destination_id')
  @Column({ type: 'uuid' })
  destinationId: string;

  @ManyToOne(() => DestinationOrmEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destinationId' })
  destination: DestinationOrmEntity;

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

  @Column({ type: 'jsonb', nullable: true })
  routeOverview?: object | null;

  @OneToMany(() => TripDayOrmEntity, (day) => day.trip, {
    cascade: ['insert', 'update'],
    orphanedRowAction: 'delete',
    eager: false,
  })
  days: TripDayOrmEntity[];
}
