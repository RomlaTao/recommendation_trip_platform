import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PLACE_MANAGEMENT_EVENT_BUS, PLACE_MANAGEMENT_REPOSITORY } from '../management.di-tokens.js';
import type { PlaceManagementRepositoryPort } from '../ports/management-repo.interface.js';
import type { PlaceManagementEventBusPort } from '../ports/event-bus.interface.js';
import { PlaceManagementAggregate } from '../../domain/entities/place-management.aggregate.js';

export interface CreatePlaceInput {
  name: string;
  description?: string | null;
  address: string;
  lat: string;
  lng: string;
  categoryId: string;
  partnerId: string;
  openingHours?: Record<string, unknown> | null;
  imageUrls?: string[] | null;
  thumbnailUrl?: string | null;
}

@Injectable()
export class CreatePlaceUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly repository: PlaceManagementRepositoryPort,
    @Inject(PLACE_MANAGEMENT_EVENT_BUS)
    private readonly eventBus: PlaceManagementEventBusPort,
  ) {}

  async execute(input: CreatePlaceInput): Promise<{ id: string }> {
    const aggregate = PlaceManagementAggregate.create({
      id: randomUUID(),
      ...input,
    });

    await this.repository.save(aggregate);
    await this.eventBus.publish(aggregate.pullEvents());

    return { id: aggregate.toSnapshot().id };
  }
}
