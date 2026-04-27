import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TripRepositoryPort } from '../../../application/ports/trip.repository.port.js';
import { TripAggregate } from '../../../domain/aggregates/trip.aggregate.js';
import { TripMapper } from '../mappers/trip.mapper.js';
import { TripOrmEntity } from '../typeorm/trip.orm-entity.js';

@Injectable()
export class TypeormTripRepository implements TripRepositoryPort {
  constructor(
    @InjectRepository(TripOrmEntity)
    private readonly repository: Repository<TripOrmEntity>,
    private readonly mapper: TripMapper,
  ) {}

  async save(trip: TripAggregate): Promise<void> {
    const orm = this.mapper.toPersistence(trip);
    await this.repository.save(orm);
  }

  async findById(id: string): Promise<TripAggregate | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: {
        days: {
          items: true,
        },
      },
    });

    if (!orm) {
      return null;
    }

    return this.mapper.toDomain(orm);
  }

  async findByUserId(input: { userId: string; page: number; limit: number }): Promise<TripAggregate[]> {
    const offset = (input.page - 1) * input.limit;

    const ormTrips = await this.repository.find({
      where: { userId: input.userId },
      order: { updatedAt: 'DESC' },
      skip: offset,
      take: input.limit,
      relations: {
        days: {
          items: true,
        },
      },
    });

    return ormTrips.map((trip) => this.mapper.toDomain(trip));
  }
}
