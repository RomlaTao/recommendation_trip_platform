import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { PlaceOrmEntity } from '../../infrastructure/persistence/typeorm/place.orm-entity.js';
import { AdminListPlacesQueryDto } from '../../presentation/dtos/admin-list-places.query.dto.js';

@Injectable()
export class ListPlacesForAdminUseCase {
  constructor(
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
  ) {}

  async execute(query: AdminListPlacesQueryDto) {
    const where: Record<string, unknown> = {};

    if (query.includeDeleted) {
      where.deletedAt = Not(IsNull());
    } else {
      where.deletedAt = IsNull();
    }

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await this.placeRepository.findAndCount({
      where,
      order: { updatedAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      withDeleted: query.includeDeleted === true,
    });

    return { items, total, page: query.page, limit: query.limit };
  }
}
