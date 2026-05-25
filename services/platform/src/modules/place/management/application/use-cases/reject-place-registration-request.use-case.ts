import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { NOTIFICATION_DISPATCH } from '../../../../notification/application/notification.di-tokens.js';
import type { NotificationDispatchPort } from '../../../../notification/application/ports/notification-dispatch.port.js';
import { PlaceRegistrationRequestInvalidStateError } from '../../domain/exceptions/place-registration-request.exception.js';
import { PlaceRegistrationRequestStatus } from '../../enums/place-registration-request-status.enum.js';
import { PlaceRegistrationRequestOrmEntity } from '../../infrastructure/persistence/typeorm/place-registration-request.orm-entity.js';

@Injectable()
export class RejectPlaceRegistrationRequestUseCase {
  constructor(
    @InjectRepository(PlaceRegistrationRequestOrmEntity)
    private readonly requestRepository: Repository<PlaceRegistrationRequestOrmEntity>,
    @Inject(NOTIFICATION_DISPATCH)
    private readonly notificationDispatch: NotificationDispatchPort,
  ) {}

  async execute(
    requestId: string,
    reviewerUserId: string,
    reason: string,
  ): Promise<{ success: true }> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, deletedAt: IsNull() },
    });
    if (!request) {
      throw new ResourceNotFoundError('place_registration_request_not_found');
    }
    if (request.status !== PlaceRegistrationRequestStatus.PENDING) {
      throw new PlaceRegistrationRequestInvalidStateError(
        'place_registration_request_not_pending',
      );
    }

    request.status = PlaceRegistrationRequestStatus.REJECTED;
    request.reviewedByUserId = reviewerUserId;
    request.reviewedAt = new Date();
    request.rejectionReason = reason.trim();
    await this.requestRepository.save(request);
    await this.notificationDispatch.notifyPlaceRejected({
      actorUserId: request.requesterUserId,
      placeId: request.id,
      reason: request.rejectionReason,
    });
    return { success: true };
  }
}
