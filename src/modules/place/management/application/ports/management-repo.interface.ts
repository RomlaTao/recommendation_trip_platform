import { PlaceManagementAggregate } from '../../domain/entities/place-management.aggregate.js';

export interface PlaceManagementRepositoryPort {
  findById(id: string): Promise<PlaceManagementAggregate | null>;
  save(aggregate: PlaceManagementAggregate): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
