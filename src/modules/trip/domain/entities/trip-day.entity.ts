import { TripItemEntity } from './trip-item.entity.js';

export interface TripDayProps {
  id: string;
  tripId: string;
  dayIndex: number;
  date: string;
  items: TripItemEntity[];
}

export class TripDayEntity {
  private props: TripDayProps;

  constructor(props: TripDayProps) {
    this.props = {
      ...props,
      items: [...props.items],
    };
  }

  get id(): string {
    return this.props.id;
  }

  get tripId(): string {
    return this.props.tripId;
  }

  get dayIndex(): number {
    return this.props.dayIndex;
  }

  get date(): string {
    return this.props.date;
  }

  changeDayIndex(dayIndex: number): void {
    this.props.dayIndex = dayIndex;
  }

  changeDate(date: string): void {
    this.props.date = date;
  }

  get items(): TripItemEntity[] {
    return [...this.props.items];
  }

  findItem(itemId: string): TripItemEntity | null {
    return this.props.items.find((item) => item.id === itemId) ?? null;
  }

  hasAnyItem(): boolean {
    return this.props.items.length > 0;
  }

  addItem(item: TripItemEntity): void {
    this.props.items.push(item);
  }

  removeItem(itemId: string): boolean {
    const before = this.props.items.length;
    this.props.items = this.props.items.filter((item) => item.id !== itemId);
    return this.props.items.length < before;
  }

  toSnapshot(): TripDayProps {
    return {
      ...this.props,
      items: [...this.props.items],
    };
  }
}
