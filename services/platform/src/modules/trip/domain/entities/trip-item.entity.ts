import { TimeSlotVO } from '../value-objects/time-slot.vo.js';

export interface TripItemProps {
  id: string;
  tripDayId: string;
  placeId: string;
  type: string;
  note?: string | null;
  sortOrder: number;
  timeSlot: TimeSlotVO;
}

export class TripItemEntity {
  private props: TripItemProps;

  constructor(props: TripItemProps) {
    this.props = {
      ...props,
      note: props.note ?? null,
    };
  }

  get id(): string {
    return this.props.id;
  }

  get tripDayId(): string {
    return this.props.tripDayId;
  }

  get placeId(): string {
    return this.props.placeId;
  }

  get type(): string {
    return this.props.type;
  }

  get note(): string | null | undefined {
    return this.props.note;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get timeSlot(): TimeSlotVO {
    return this.props.timeSlot;
  }

  changeTime(startTime: string, endTime: string): void {
    this.props.timeSlot = new TimeSlotVO(startTime, endTime);
  }

  changePlace(placeId: string): void {
    this.props.placeId = placeId;
  }

  changeType(type: string): void {
    this.props.type = type;
  }

  changeNote(note?: string | null): void {
    this.props.note = note ?? null;
  }

  changeSortOrder(sortOrder: number): void {
    this.props.sortOrder = sortOrder;
  }

  toSnapshot(): TripItemProps {
    return {
      ...this.props,
    };
  }
}
