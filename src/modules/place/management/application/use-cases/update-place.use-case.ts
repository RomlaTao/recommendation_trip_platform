import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { PLACE_MANAGEMENT_EVENT_BUS, PLACE_MANAGEMENT_REPOSITORY } from '../management.di-tokens.js';
import type { PlaceManagementRepositoryPort } from '../ports/management-repo.interface.js';
import type { PlaceManagementEventBusPort } from '../ports/event-bus.interface.js';
import {
  PlaceActorContext,
  UpdatePlaceInput,
} from '../../domain/entities/place-management.aggregate.js';

export interface UpdatePlaceUseCaseInput extends UpdatePlaceInput {
  placeId: string;
  actor: PlaceActorContext;
}

@Injectable()
export class UpdatePlaceUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly repository: PlaceManagementRepositoryPort,
    @Inject(PLACE_MANAGEMENT_EVENT_BUS)
    private readonly eventBus: PlaceManagementEventBusPort,
  ) {}

  async execute(input: UpdatePlaceUseCaseInput): Promise<void> {
    const place = await this.repository.findById(input.placeId);
    if (!place) throw new ResourceNotFoundError('place_not_found');

    place.update(input.actor, input);
    await this.repository.save(place);
    await this.eventBus.publish(place.pullEvents());
  }
}
