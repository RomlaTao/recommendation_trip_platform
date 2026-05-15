import { randomUUID } from 'node:crypto';

import { TripConfirmEmptyError } from '../errors/trip-confirm-empty.error.js';
import { TripInvalidStateTransitionError } from '../errors/trip-invalid-state-transition.error.js';
import { TripItemDateOutOfRangeError } from '../errors/trip-item-date-out-of-range.error.js';
import { TripItemTimeOverlapError } from '../errors/trip-item-time-overlap.error.js';
import { TripTerminalStateMutationError } from '../errors/trip-terminal-state-mutation.error.js';
import { TripStatus } from '../enums/trip-status.enum.js';
import { TripDayEntity } from '../entities/trip-day.entity.js';
import { TripItemEntity } from '../entities/trip-item.entity.js';
import { TimeSlotVO } from '../value-objects/time-slot.vo.js';
import { TripDateRangeVO } from '../value-objects/trip-date-range.vo.js';

export interface TripAggregateSnapshot {
  id: string;
  userId: string;
  destinationId: string;
  title: string;
  status: TripStatus;
  dateRange: TripDateRangeVO;
  days: TripDayEntity[];
  version: number;
}

export interface CreateTripAggregateInput {
  userId: string;
  destinationId: string;
  title: string;
  startDate: string;
  endDate: string;
}

export interface AddTripItemInput {
  tripDayId: string;
  placeId: string;
  type: string;
  startTime: string;
  endTime: string;
  note?: string | null;
  sortOrder?: number;
}

export interface UpdateTripItemInput {
  tripDayId: string;
  itemId: string;
  placeId?: string;
  type?: string;
  note?: string | null;
  sortOrder?: number;
}

export class TripAggregate {
  private constructor(private readonly snapshot: TripAggregateSnapshot) {}

  static create(input: CreateTripAggregateInput): TripAggregate {
    const dateRange = new TripDateRangeVO(input.startDate, input.endDate);

    return new TripAggregate({
      id: randomUUID(),
      userId: input.userId,
      destinationId: input.destinationId,
      title: input.title,
      status: TripStatus.DRAFT,
      dateRange,
      days: [],
      version: 0,
    });
  }

  static reconstitute(snapshot: TripAggregateSnapshot): TripAggregate {
    return new TripAggregate({
      ...snapshot,
      days: [...snapshot.days],
    });
  }

  get id(): string {
    return this.snapshot.id;
  }

  get status(): TripStatus {
    return this.snapshot.status;
  }

  get days(): TripDayEntity[] {
    return [...this.snapshot.days];
  }

  get dateRange(): TripDateRangeVO {
    return this.snapshot.dateRange;
  }

  setTitle(title: string): void {
    this.ensureNotTerminalState();
    this.snapshot.title = title;
    this.bumpVersion();
  }

  addDay(input: { id: string; dayIndex: number; date: string }): void {
    this.ensureNotTerminalState();
    this.ensureDateInsideRange(input.date);

    const existing = this.snapshot.days.find(
      (day) => day.dayIndex === input.dayIndex,
    );
    if (existing) {
      throw new TripInvalidStateTransitionError(
        'trip_day_index_already_exists',
      );
    }

    this.snapshot.days.push(
      new TripDayEntity({
        id: input.id,
        tripId: this.snapshot.id,
        dayIndex: input.dayIndex,
        date: input.date,
        items: [],
      }),
    );

    this.bumpVersion();
  }

  updateDay(input: { dayId: string; dayIndex?: number; date?: string }): void {
    this.ensureNotTerminalState();

    const day = this.findDayOrThrow(input.dayId);

    if (input.dayIndex !== undefined && input.dayIndex !== day.dayIndex) {
      const duplicateDayIndex = this.snapshot.days.some(
        (existingDay) =>
          existingDay.id !== input.dayId &&
          existingDay.dayIndex === input.dayIndex,
      );

      if (duplicateDayIndex) {
        throw new TripInvalidStateTransitionError(
          'trip_day_index_already_exists',
        );
      }

      day.changeDayIndex(input.dayIndex);
    }

    if (input.date !== undefined && input.date !== day.date) {
      this.ensureDateInsideRange(input.date);
      day.changeDate(input.date);
    }

    this.bumpVersion();
  }

  removeDay(input: { dayId: string }): void {
    this.ensureNotTerminalState();

    const day = this.findDayOrThrow(input.dayId);
    if (day.hasAnyItem()) {
      throw new TripInvalidStateTransitionError(
        'trip_day_remove_requires_empty_day',
      );
    }

    this.snapshot.days = this.snapshot.days.filter(
      (existingDay) => existingDay.id !== input.dayId,
    );
    this.bumpVersion();
  }

  addItem(input: AddTripItemInput): void {
    this.ensureNotTerminalState();

    const day = this.findDayOrThrow(input.tripDayId);
    this.ensureDateInsideRange(day.date);

    const newSlot = new TimeSlotVO(input.startTime, input.endTime);

    if (
      day.items.some((existingItem) => existingItem.timeSlot.overlaps(newSlot))
    ) {
      throw new TripItemTimeOverlapError();
    }

    day.addItem(
      new TripItemEntity({
        id: randomUUID(),
        tripDayId: day.id,
        placeId: input.placeId,
        type: input.type,
        note: input.note ?? null,
        sortOrder: input.sortOrder ?? day.items.length + 1,
        timeSlot: newSlot,
      }),
    );

    this.bumpVersion();
  }

  rescheduleItem(input: {
    tripDayId: string;
    itemId: string;
    startTime: string;
    endTime: string;
  }): void {
    this.ensureNotTerminalState();

    const day = this.findDayOrThrow(input.tripDayId);
    const item = day.findItem(input.itemId);
    if (!item) {
      throw new TripInvalidStateTransitionError('trip_item_not_found');
    }

    const candidateSlot = new TimeSlotVO(input.startTime, input.endTime);
    const hasOverlap = day.items
      .filter((existingItem) => existingItem.id !== input.itemId)
      .some((existingItem) => existingItem.timeSlot.overlaps(candidateSlot));

    if (hasOverlap) {
      throw new TripItemTimeOverlapError();
    }

    item.changeTime(input.startTime, input.endTime);
    this.bumpVersion();
  }

  removeItem(input: { tripDayId: string; itemId: string }): void {
    this.ensureNotTerminalState();
    const day = this.findDayOrThrow(input.tripDayId);
    const removed = day.removeItem(input.itemId);

    if (!removed) {
      throw new TripInvalidStateTransitionError('trip_item_not_found');
    }

    this.bumpVersion();
  }

  updateItem(input: UpdateTripItemInput): void {
    this.ensureNotTerminalState();

    const day = this.findDayOrThrow(input.tripDayId);
    const item = day.findItem(input.itemId);
    if (!item) {
      throw new TripInvalidStateTransitionError('trip_item_not_found');
    }

    if (input.placeId !== undefined) {
      item.changePlace(input.placeId);
    }

    if (input.type !== undefined) {
      item.changeType(input.type);
    }

    if (input.note !== undefined) {
      item.changeNote(input.note);
    }

    if (input.sortOrder !== undefined) {
      item.changeSortOrder(input.sortOrder);
    }

    this.bumpVersion();
  }

  confirm(): void {
    if (this.snapshot.status !== TripStatus.DRAFT) {
      throw new TripInvalidStateTransitionError(
        'trip_confirm_requires_draft_status',
      );
    }

    const hasAtLeastOneItem = this.snapshot.days.some((day) =>
      day.hasAnyItem(),
    );
    if (!hasAtLeastOneItem) {
      throw new TripConfirmEmptyError();
    }

    this.snapshot.status = TripStatus.UPCOMING;
    this.bumpVersion();
  }

  cancel(): void {
    if (
      this.snapshot.status !== TripStatus.DRAFT &&
      this.snapshot.status !== TripStatus.UPCOMING
    ) {
      throw new TripInvalidStateTransitionError(
        'trip_cancel_requires_draft_or_upcoming_status',
      );
    }

    this.snapshot.status = TripStatus.CANCELLED;
    this.bumpVersion();
  }

  start(): void {
    if (this.snapshot.status !== TripStatus.UPCOMING) {
      throw new TripInvalidStateTransitionError(
        'trip_start_requires_upcoming_status',
      );
    }

    this.snapshot.status = TripStatus.ONGOING;
    this.bumpVersion();
  }

  complete(): void {
    if (this.snapshot.status !== TripStatus.ONGOING) {
      throw new TripInvalidStateTransitionError(
        'trip_complete_requires_ongoing_status',
      );
    }

    this.snapshot.status = TripStatus.COMPLETED;
    this.bumpVersion();
  }

  toSnapshot(): TripAggregateSnapshot {
    return {
      ...this.snapshot,
      days: [...this.snapshot.days],
    };
  }

  private ensureDateInsideRange(date: string): void {
    if (!this.snapshot.dateRange.containsDate(date)) {
      throw new TripItemDateOutOfRangeError();
    }
  }

  private ensureNotTerminalState(): void {
    if (
      this.snapshot.status === TripStatus.COMPLETED ||
      this.snapshot.status === TripStatus.CANCELLED
    ) {
      throw new TripTerminalStateMutationError();
    }
  }

  private findDayOrThrow(dayId: string): TripDayEntity {
    const day = this.snapshot.days.find((item) => item.id === dayId);
    if (!day) {
      throw new TripInvalidStateTransitionError('trip_day_not_found');
    }
    return day;
  }

  private bumpVersion(): void {
    this.snapshot.version += 1;
  }
}
