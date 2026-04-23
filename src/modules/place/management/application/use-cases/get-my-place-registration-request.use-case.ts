import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { PlaceRegistrationRequestForbiddenError } from '../../domain/exceptions/place-registration-request.exception.js';
import { PlaceRegistrationRequestOrmEntity } from '../../infrastructure/persistence/typeorm/place-registration-request.orm-entity.js';

@Injectable()
export class GetMyPlaceRegistrationRequestUseCase {
  constructor(
    @InjectRepository(PlaceRegistrationRequestOrmEntity)
    private readonly requestRepository: Repository<PlaceRegistrationRequestOrmEntity>,
  ) {}

  async execute(userId: string, requestId: string) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, deletedAt: IsNull() },
    });
    if (!request) {
      throw new ResourceNotFoundError('place_registration_request_not_found');
    }
    if (request.requesterUserId !== userId) {
      throw new PlaceRegistrationRequestForbiddenError();
    }
    return request;
  }
}
