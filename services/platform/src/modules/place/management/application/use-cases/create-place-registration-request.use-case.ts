import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { User } from '../../../../user/entities/user.entity.js';
import { Inject } from '@nestjs/common';
import { PlaceRegistrationRequestStatus } from '../../enums/place-registration-request-status.enum.js';
import { PartnerOrmEntity } from '../../infrastructure/persistence/typeorm/partner.orm-entity.js';
import { DestinationOrmEntity } from '../../infrastructure/persistence/typeorm/destination.orm-entity.js';
import { PlaceCategoryOrmEntity } from '../../infrastructure/persistence/typeorm/place-category.orm-entity.js';
import { PlaceRegistrationRequestOrmEntity } from '../../infrastructure/persistence/typeorm/place-registration-request.orm-entity.js';
import { CreatePlaceRegistrationRequestDto } from '../../presentation/dtos/create-place-registration-request.dto.js';
import { PLACE_MANAGEMENT_EVENT_BUS } from '../management.di-tokens.js';
import type { PlaceManagementEventBusPort } from '../ports/event-bus.interface.js';
import { PlaceRegistrationRequestSubmittedEvent } from '../../domain/events/place-management.events.js';

@Injectable()
export class CreatePlaceRegistrationRequestUseCase {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(PLACE_MANAGEMENT_EVENT_BUS)
    private readonly eventBus: PlaceManagementEventBusPort,
    @InjectRepository(PlaceRegistrationRequestOrmEntity)
    private readonly requestRepository: Repository<PlaceRegistrationRequestOrmEntity>,
  ) {}

  async execute(
    userId: string,
    dto: CreatePlaceRegistrationRequestDto,
  ): Promise<{ id: string }> {
    const created = await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const categoryRepo = manager.getRepository(PlaceCategoryOrmEntity);
      const destinationRepo = manager.getRepository(DestinationOrmEntity);
      const partnerRepo = manager.getRepository(PartnerOrmEntity);
      const requestRepo = manager.getRepository(
        PlaceRegistrationRequestOrmEntity,
      );

      const requester = await userRepo.findOne({
        where: { id: userId, deletedAt: IsNull() },
      });
      if (!requester) {
        throw new ResourceNotFoundError('requester_user_not_found');
      }

      const category = await categoryRepo.findOne({
        where: { id: dto.categoryId, deletedAt: IsNull() },
      });
      if (!category) {
        throw new ResourceNotFoundError('place_category_not_found');
      }

      if (dto.destinationId) {
        const destination = await destinationRepo.findOne({
          where: { id: dto.destinationId, deletedAt: IsNull() },
        });
        if (!destination) {
          throw new ResourceNotFoundError('destination_not_found');
        }
      }

      let partner = await partnerRepo.findOne({
        where: { ownerUserId: userId, deletedAt: IsNull() },
      });
      if (!partner) {
        const byId = await partnerRepo.findOne({
          where: { id: userId },
          withDeleted: true,
        });
        if (byId) {
          await partnerRepo.restore(byId.id);
          byId.ownerUserId = userId;
          partner = await partnerRepo.save(byId);
        } else {
          partner = await partnerRepo.save(
            partnerRepo.create({
              id: userId,
              name: `${requester.username?.trim() || requester.email} Partner`,
              slug: `partner-${userId}`,
              ownerUserId: userId,
            }),
          );
        }
      }

      return requestRepo.save(
        requestRepo.create({
          requesterUserId: userId,
          partnerId: partner.id,
          status: PlaceRegistrationRequestStatus.PENDING,
          ...dto,
        }),
      );
    });
    await this.eventBus.publish([
      new PlaceRegistrationRequestSubmittedEvent(
        created.id,
        userId,
        created.name,
      ),
    ]);
    return { id: created.id };
  }
}
