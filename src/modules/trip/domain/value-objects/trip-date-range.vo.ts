import { InvalidTripDateRangeError } from '../errors/invalid-trip-date-range.error.js';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

export class TripDateRangeVO {
  public readonly startDate: Date;
  public readonly endDate: Date;

  constructor(startDate: Date | string, endDate: Date | string) {
    this.startDate = TripDateRangeVO.normalizeDate(startDate);
    this.endDate = TripDateRangeVO.normalizeDate(endDate);

    if (this.startDate.getTime() > this.endDate.getTime()) {
      throw new InvalidTripDateRangeError(
        'trip_start_date_must_be_before_or_equal_end_date',
      );
    }
  }

  containsDate(date: Date | string): boolean {
    const target = TripDateRangeVO.normalizeDate(date).getTime();
    return (
      target >= this.startDate.getTime() && target <= this.endDate.getTime()
    );
  }

  durationInDays(): number {
    return (
      Math.floor(
        (this.endDate.getTime() - this.startDate.getTime()) /
          MILLISECONDS_IN_DAY,
      ) + 1
    );
  }

  equals(other: TripDateRangeVO): boolean {
    return (
      this.startDate.getTime() === other.startDate.getTime() &&
      this.endDate.getTime() === other.endDate.getTime()
    );
  }

  private static normalizeDate(value: Date | string): Date {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new InvalidTripDateRangeError('trip_date_is_invalid');
      }

      return new Date(
        Date.UTC(
          value.getUTCFullYear(),
          value.getUTCMonth(),
          value.getUTCDate(),
        ),
      );
    }

    if (!DATE_ONLY_REGEX.test(value)) {
      throw new InvalidTripDateRangeError(
        'trip_date_format_must_be_yyyy_mm_dd',
      );
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(parsed.getTime())) {
      throw new InvalidTripDateRangeError('trip_date_is_invalid');
    }

    return parsed;
  }
}
