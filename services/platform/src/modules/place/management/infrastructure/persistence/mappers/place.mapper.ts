import { Injectable } from '@nestjs/common';
import { PlaceOrmEntity } from '../typeorm/place.orm-entity.js';
import { PlaceManagementAggregate } from '../../../domain/entities/place-management.aggregate.js';
import { PlaceManagementStatus } from '../../../domain/enums/place-status.enum.js';

@Injectable()
export class PlaceMapper {
  toDomain(entity: PlaceOrmEntity): PlaceManagementAggregate {
    return PlaceManagementAggregate.reconstitute({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      address: entity.address,
      lat: entity.lat,
      lng: entity.lng,
      categoryId: entity.categoryId,
      partnerId: entity.partnerId,
      status: entity.status as unknown as PlaceManagementStatus,
      rejectionReason: entity.rejectionReason,
      openingHours: entity.openingHours,
      imageUrls: entity.imageUrls,
      thumbnailUrl: entity.thumbnailUrl,
      googlePlaceId: entity.googlePlaceId,
      tagScores: entity.tagScores,
      dataSource: entity.dataSource,
      importBatchId: entity.importBatchId,
      deletedReason: entity.deletedReason,
      deletedByUserId: entity.deletedByUserId,
      deletedByRole: entity.deletedByRole,
      deletedAt: entity.deletedAt ?? null,
    });
  }

  toPersistence(
    aggregate: PlaceManagementAggregate,
    target?: PlaceOrmEntity,
  ): PlaceOrmEntity {
    const snapshot = aggregate.toSnapshot();
    const entity = target ?? new PlaceOrmEntity();

    entity.id = snapshot.id;
    entity.name = snapshot.name;
    entity.description = snapshot.description;
    entity.address = snapshot.address;
    entity.lat = snapshot.lat;
    entity.lng = snapshot.lng;
    entity.categoryId = snapshot.categoryId;
    entity.partnerId = snapshot.partnerId;
    entity.status = snapshot.status as unknown as PlaceOrmEntity['status'];
    entity.rejectionReason = snapshot.rejectionReason;
    entity.openingHours = snapshot.openingHours;
    entity.imageUrls = snapshot.imageUrls;
    entity.thumbnailUrl = snapshot.thumbnailUrl;
    entity.googlePlaceId = snapshot.googlePlaceId;
    entity.tagScores = snapshot.tagScores;
    entity.dataSource = snapshot.dataSource;
    entity.importBatchId = snapshot.importBatchId;
    entity.deletedReason = snapshot.deletedReason;
    entity.deletedByUserId = snapshot.deletedByUserId;
    entity.deletedByRole = snapshot.deletedByRole;

    return entity;
  }
}
