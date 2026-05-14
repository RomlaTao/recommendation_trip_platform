import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RabbitMqConfig } from '../../../../../../core/config/rabbitmq.config.js';
import { PlaceMlOutboxWriterService } from '../../../../messaging/place-ml-outbox-writer.service.js';
import { PlaceManagementRepositoryPort } from '../../../application/ports/management-repo.interface.js';
import { PlaceManagementAggregate } from '../../../domain/entities/place-management.aggregate.js';
import { PlaceMapper } from '../mappers/place.mapper.js';
import { PlaceOrmEntity } from './place.orm-entity.js';

@Injectable()
export class PlaceManagementRepository implements PlaceManagementRepositoryPort {
  constructor(
    @InjectRepository(PlaceOrmEntity)
    private readonly repository: Repository<PlaceOrmEntity>,
    private readonly mapper: PlaceMapper,
    private readonly placeMlOutboxWriter: PlaceMlOutboxWriterService,
    private readonly configService: ConfigService,
  ) {}

  private projectionRoutingKey(): string {
    return (
      this.configService.get<RabbitMqConfig>('rabbitmq')
        ?.placeProjectionRoutingKey ?? 'place.projection.v1'
    );
  }

  async findById(id: string): Promise<PlaceManagementAggregate | null> {
    const found = await this.repository.findOne({
      where: { id },
      withDeleted: true,
    });
    return found ? this.mapper.toDomain(found) : null;
  }

  async save(aggregate: PlaceManagementAggregate): Promise<void> {
    const rk = this.projectionRoutingKey();
    await this.repository.manager.transaction(async (manager) => {
      const snapshot = aggregate.toSnapshot();
      const existing = await manager.findOne(PlaceOrmEntity, {
        where: { id: snapshot.id },
        withDeleted: true,
      });
      const entity = this.mapper.toPersistence(aggregate, existing ?? undefined);
      await manager.save(PlaceOrmEntity, entity);
      const reloaded = await manager.findOne(PlaceOrmEntity, {
        where: { id: entity.id },
        withDeleted: true,
      });
      if (reloaded) {
        await this.placeMlOutboxWriter.enqueueProjectionFromPlace(
          manager,
          reloaded,
          rk,
        );
      }
    });
  }

  async softDelete(id: string): Promise<void> {
    const rk = this.projectionRoutingKey();
    await this.repository.manager.transaction(async (manager) => {
      await manager.softDelete(PlaceOrmEntity, { id });
      const reloaded = await manager.findOne(PlaceOrmEntity, {
        where: { id },
        withDeleted: true,
      });
      if (reloaded) {
        await this.placeMlOutboxWriter.enqueueProjectionFromPlace(
          manager,
          reloaded,
          rk,
        );
      }
    });
  }

  async restore(id: string): Promise<void> {
    const rk = this.projectionRoutingKey();
    await this.repository.manager.transaction(async (manager) => {
      await manager.restore(PlaceOrmEntity, { id });
      const reloaded = await manager.findOne(PlaceOrmEntity, {
        where: { id },
      });
      if (reloaded) {
        await this.placeMlOutboxWriter.enqueueProjectionFromPlace(
          manager,
          reloaded,
          rk,
        );
      }
    });
  }
}
