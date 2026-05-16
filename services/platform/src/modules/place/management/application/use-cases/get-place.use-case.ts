import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { PLACE_MANAGEMENT_REPOSITORY } from '../management.di-tokens.js';
import type { PlaceManagementRepositoryPort } from '../ports/management-repo.interface.js';
import { PlaceManagementSnapshot } from '../../domain/entities/place-management.aggregate.js';

@Injectable()
export class GetPlaceUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly repository: PlaceManagementRepositoryPort,
  ) {}

  async execute(placeId: string): Promise<PlaceManagementSnapshot> {
    const place = await this.repository.findById(placeId);
    if (!place) throw new ResourceNotFoundError('place_not_found');
    return place.toSnapshot();
  }
}
