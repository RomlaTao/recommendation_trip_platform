import { InvalidTimeSlotError } from '../errors/invalid-time-slot.error.js';

const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MAX_MINUTE_VALUE = HOURS_IN_DAY * MINUTES_IN_HOUR;
const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class TimeSlotVO {
  public readonly startTime: string;
  public readonly endTime: string;

  private readonly startMinutes: number;
  private readonly endMinutes: number;

  constructor(startTime: string, endTime: string) {
    this.startMinutes = TimeSlotVO.toMinutes(startTime);
    this.endMinutes = TimeSlotVO.toMinutes(endTime);

    if (this.startMinutes >= this.endMinutes) {
      throw new InvalidTimeSlotError('time_slot_start_must_be_before_end');
    }

    this.startTime = startTime;
    this.endTime = endTime;
  }

  overlaps(other: TimeSlotVO): boolean {
    return (
      this.startMinutes < other.endMinutes &&
      other.startMinutes < this.endMinutes
    );
  }

  durationInMinutes(): number {
    return this.endMinutes - this.startMinutes;
  }

  equals(other: TimeSlotVO): boolean {
    return (
      this.startMinutes === other.startMinutes &&
      this.endMinutes === other.endMinutes
    );
  }

  includes(time: string): boolean {
    const minuteValue = TimeSlotVO.toMinutes(time);
    return minuteValue >= this.startMinutes && minuteValue < this.endMinutes;
  }

  private static toMinutes(time: string): number {
    const match = TIME_24H_REGEX.exec(time);

    if (!match) {
      throw new InvalidTimeSlotError('time_slot_invalid_format');
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const totalMinutes = hours * MINUTES_IN_HOUR + minutes;

    if (totalMinutes < 0 || totalMinutes >= MAX_MINUTE_VALUE) {
      throw new InvalidTimeSlotError('time_slot_out_of_range');
    }

    return totalMinutes;
  }
}
