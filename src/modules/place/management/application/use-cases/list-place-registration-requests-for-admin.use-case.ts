import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PlaceRegistrationRequestOrmEntity } from '../../infrastructure/persistence/typeorm/place-registration-request.orm-entity.js';
import { ListPlaceRegistrationRequestsQueryDto } from '../../presentation/dtos/list-place-registration-requests.query.dto.js';

@Injectable()
export class ListPlaceRegistrationRequestsForAdminUseCase {
  constructor(
    @InjectRepository(PlaceRegistrationRequestOrmEntity)
    private readonly requestRepository: Repository<PlaceRegistrationRequestOrmEntity>,
  ) {}

  async execute(query: ListPlaceRegistrationRequestsQueryDto) {
    const where: Record<string, unknown> = {
      deletedAt: IsNull(),
    };
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await this.requestRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return { items, total, page: query.page, limit: query.limit };
  }
}
