import { Injectable } from '@nestjs/common';

import { TripAggregate, TripAggregateSnapshot } from '../../../domain/aggregates/trip.aggregate.js';
import { TripDayEntity } from '../../../domain/entities/trip-day.entity.js';
import { TripItemEntity } from '../../../domain/entities/trip-item.entity.js';
import { TimeSlotVO } from '../../../domain/value-objects/time-slot.vo.js';
import { TripDateRangeVO } from '../../../domain/value-objects/trip-date-range.vo.js';
import { TripDayOrmEntity } from '../typeorm/trip-day.orm-entity.js';
import { TripItemOrmEntity } from '../typeorm/trip-item.orm-entity.js';
import { TripOrmEntity } from '../typeorm/trip.orm-entity.js';

@Injectable()
export class TripMapper {
  toDomain(orm: TripOrmEntity): TripAggregate {
    const snapshot: TripAggregateSnapshot = {
      id: orm.id,
      userId: orm.userId,
      title: orm.title,
      status: orm.status,
      dateRange: new TripDateRangeVO(orm.startDate, orm.endDate),
      version: orm.version,
      days: (orm.days ?? [])
        .map((day) => this.toDomainDay(day))
        .sort((a, b) => a.dayIndex - b.dayIndex),
    };

    return TripAggregate.reconstitute(snapshot);
  }

  toPersistence(aggregate: TripAggregate): TripOrmEntity {
    const snapshot = aggregate.toSnapshot();
    const orm = new TripOrmEntity();

    orm.id = snapshot.id;
    orm.userId = snapshot.userId;
    orm.title = snapshot.title;
    orm.status = snapshot.status;
    orm.startDate = this.toDateOnlyString(snapshot.dateRange.startDate);
    orm.endDate = this.toDateOnlyString(snapshot.dateRange.endDate);
    orm.version = snapshot.version;
    orm.days = snapshot.days.map((day) => this.toPersistenceDay(day, snapshot.id));

    return orm;
  }

  private toDomainDay(dayOrm: TripDayOrmEntity): TripDayEntity {
    return new TripDayEntity({
      id: dayOrm.id,
      tripId: dayOrm.tripId,
      dayIndex: dayOrm.dayIndex,
      date: dayOrm.date,
      items: (dayOrm.items ?? [])
        .map((item) => this.toDomainItem(item))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    });
  }

  private toDomainItem(itemOrm: TripItemOrmEntity): TripItemEntity {
    return new TripItemEntity({
      id: itemOrm.id,
      tripDayId: itemOrm.tripDayId,
      placeId: itemOrm.placeId,
      type: itemOrm.type,
      note: itemOrm.note ?? null,
      sortOrder: itemOrm.sortOrder,
      timeSlot: new TimeSlotVO(itemOrm.startTime.slice(0, 5), itemOrm.endTime.slice(0, 5)),
    });
  }

  private toPersistenceDay(day: TripDayEntity, tripId: string): TripDayOrmEntity {
    const snapshot = day.toSnapshot();
    const orm = new TripDayOrmEntity();

    orm.id = snapshot.id;
    orm.tripId = tripId;
    orm.dayIndex = snapshot.dayIndex;
    orm.date = snapshot.date;
    orm.items = snapshot.items.map((item) => this.toPersistenceItem(item, snapshot.id));

    return orm;
  }

  private toPersistenceItem(item: TripItemEntity, tripDayId: string): TripItemOrmEntity {
    const snapshot = item.toSnapshot();
    const orm = new TripItemOrmEntity();

    orm.id = snapshot.id;
    orm.tripDayId = tripDayId;
    orm.placeId = snapshot.placeId;
    orm.type = snapshot.type;
    orm.note = snapshot.note ?? null;
    orm.sortOrder = snapshot.sortOrder;
    orm.startTime = snapshot.timeSlot.startTime;
    orm.endTime = snapshot.timeSlot.endTime;

    return orm;
  }

  private toDateOnlyString(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
