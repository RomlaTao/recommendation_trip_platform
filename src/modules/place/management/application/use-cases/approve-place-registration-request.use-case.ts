import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, IsNull } from 'typeorm';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { PLACE_MANAGEMENT_EVENT_BUS } from '../management.di-tokens.js';
import type { PlaceManagementEventBusPort } from '../ports/event-bus.interface.js';
import { PlaceManagementAggregate } from '../../domain/entities/place-management.aggregate.js';
import { PlaceRegistrationRequestInvalidStateError } from '../../domain/exceptions/place-registration-request.exception.js';
import { PlaceRegistrationRequestStatus } from '../../enums/place-registration-request-status.enum.js';
import { PlaceMapper } from '../../infrastructure/persistence/mappers/place.mapper.js';
import { PartnerOrmEntity } from '../../infrastructure/persistence/typeorm/partner.orm-entity.js';
import { PlaceRegistrationRequestOrmEntity } from '../../infrastructure/persistence/typeorm/place-registration-request.orm-entity.js';
import { PlaceOrmEntity } from '../../infrastructure/persistence/typeorm/place.orm-entity.js';
import { NotificationService } from '../../../../notification/services/notification.service.js';

@Injectable()
export class ApprovePlaceRegistrationRequestUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly placeMapper: PlaceMapper,
    private readonly notificationService: NotificationService,
    @Inject(PLACE_MANAGEMENT_EVENT_BUS)
    private readonly eventBus: PlaceManagementEventBusPort,
  ) {}

  async execute(requestId: string, reviewerUserId: string): Promise<{ requestId: string; placeId: string }> {
    const result = await this.dataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(PlaceRegistrationRequestOrmEntity);
      const partnerRepo = manager.getRepository(PartnerOrmEntity);
      const placeRepo = manager.getRepository(PlaceOrmEntity);

      const request = await requestRepo.findOne({
        where: { id: requestId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!request) {
        throw new ResourceNotFoundError('place_registration_request_not_found');
      }
      if (request.status !== PlaceRegistrationRequestStatus.PENDING) {
        throw new PlaceRegistrationRequestInvalidStateError('place_registration_request_not_pending');
      }

      const partner = await partnerRepo.findOne({
        where: { id: request.partnerId, deletedAt: IsNull() },
      });
      if (!partner) {
        throw new ResourceNotFoundError('partner_not_found');
      }

      const place = PlaceManagementAggregate.create({
        id: randomUUID(),
        name: request.name,
        description: request.description ?? null,
        address: request.address,
        lat: request.lat,
        lng: request.lng,
        categoryId: request.categoryId,
        partnerId: partner.id,
        imageUrls: request.imageUrls ?? null,
        thumbnailUrl: request.thumbnailUrl ?? null,
      });
      const placeEntity = this.placeMapper.toPersistence(place);
      await placeRepo.save(placeEntity);

      request.status = PlaceRegistrationRequestStatus.APPROVED;
      request.reviewedByUserId = reviewerUserId;
      request.reviewedAt = new Date();
      request.rejectionReason = null;
      request.approvedPlaceId = placeEntity.id;
      await requestRepo.save(request);

      return {
        requestId: request.id,
        placeId: placeEntity.id,
        requesterUserId: request.requesterUserId,
        events: place.pullEvents(),
      };
    });

    await this.eventBus.publish(result.events);
    await this.notificationService.notifyPlaceApproved({
      actorUserId: result.requesterUserId,
      placeId: result.placeId,
    });
    return { requestId: result.requestId, placeId: result.placeId };
  }
}
