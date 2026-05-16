import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import {
  PLACE_MANAGEMENT_EVENT_BUS,
  PLACE_MANAGEMENT_REPOSITORY,
} from '../management.di-tokens.js';
import type { PlaceManagementRepositoryPort } from '../ports/management-repo.interface.js';
import type { PlaceManagementEventBusPort } from '../ports/event-bus.interface.js';
import { PlaceActorContext } from '../../domain/entities/place-management.aggregate.js';

export interface DeleteOwnPlaceUseCaseInput {
  placeId: string;
  actor: PlaceActorContext;
}

@Injectable()
export class DeleteOwnPlaceUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly repository: PlaceManagementRepositoryPort,
    @Inject(PLACE_MANAGEMENT_EVENT_BUS)
    private readonly eventBus: PlaceManagementEventBusPort,
  ) {}

  async execute(input: DeleteOwnPlaceUseCaseInput): Promise<void> {
    const place = await this.repository.findById(input.placeId);
    if (!place) throw new ResourceNotFoundError('place_not_found');

    place.deleteByOwner(input.actor);
    await this.repository.save(place);
    await this.repository.softDelete(input.placeId);
    await this.eventBus.publish(place.pullEvents());
  }
}
