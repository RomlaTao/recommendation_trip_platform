import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { PlaceManagementEventBusPort } from '../../application/ports/event-bus.interface.js';
import {
  DomainEvent,
  PlaceApprovedEvent,
  PlaceRegistrationRequestSubmittedEvent,
  PlaceRejectedEvent,
} from '../../domain/events/place-management.events.js';
import { NotificationService } from '../../../../notification/services/notification.service.js';
import { Role } from '../../../../permission/entities/role.entity.js';
import { UserRole } from '../../../../permission/entities/user-role.entity.js';

@Injectable()
export class NestEventBusAdapter implements PlaceManagementEventBusPort {
  private readonly logger = new Logger(NestEventBusAdapter.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      // Lightweight event publishing for now; can be replaced by outbox/message bus later.
      this.logger.log(
        `Published domain event: ${event.metadata.eventType} (id=${event.metadata.eventId}, aggregate=${event.metadata.aggregateType}:${event.metadata.aggregateId})`,
      );

      if (event instanceof PlaceApprovedEvent) {
        await this.notificationService.notifyPlaceApproved({
          actorUserId: event.actorUserId,
          placeId: event.placeId,
        });
      } else if (event instanceof PlaceRegistrationRequestSubmittedEvent) {
        const reviewerUserIds = await this.getReviewerUserIds();
        for (const reviewerUserId of reviewerUserIds) {
          await this.notificationService.notifyPlaceRequestSubmitted({
            recipientUserId: reviewerUserId,
            requestId: event.requestId,
            placeName: event.placeName,
            requesterUserId: event.requesterUserId,
          });
        }
      } else if (event instanceof PlaceRejectedEvent) {
        await this.notificationService.notifyPlaceRejected({
          actorUserId: event.actorUserId,
          placeId: event.placeId,
          reason: event.reason,
        });
      }
    }
  }

  private async getReviewerUserIds(): Promise<string[]> {
    const roles = await this.roleRepository.find({
      where: { code: In(['ADMIN', 'MODERATOR']), deletedAt: IsNull() },
    });
    if (roles.length === 0) return [];

    const mappings = await this.userRoleRepository.find({
      where: { roleId: In(roles.map((role) => role.id)), deletedAt: IsNull() },
      select: { userId: true },
    });
    return [...new Set(mappings.map((mapping) => mapping.userId))];
  }
}
