import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async findById(id: string): Promise<PlaceManagementAggregate | null> {
    const found = await this.repository.findOne({
      where: { id },
      withDeleted: true,
    });
    return found ? this.mapper.toDomain(found) : null;
  }

  async save(aggregate: PlaceManagementAggregate): Promise<void> {
    const snapshot = aggregate.toSnapshot();
    const existing = await this.repository.findOne({
      where: { id: snapshot.id },
      withDeleted: true,
    });
    const entity = this.mapper.toPersistence(aggregate, existing ?? undefined);
    await this.repository.save(entity);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
  }
}
