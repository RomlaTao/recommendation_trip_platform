import { PlaceDataSource } from '../../enums/place-data-source.enum.js';
import { PlaceDeletionActorRole } from '../../enums/place-deletion-actor-role.enum.js';
import { PlaceManagementStatus } from '../enums/place-status.enum.js';
import {
  InvalidWorkflowException,
  PlaceDeletedException,
  PlaceNotDeletedException,
  PlaceOwnershipException,
} from '../exceptions/invalid-workflow.exception.js';
import {
  DomainEvent,
  PlaceApprovedEvent,
  PlaceDeletedByAdminEvent,
  PlaceDeletedByOwnerEvent,
  PlaceRejectedEvent,
  PlaceRestoredByAdminEvent,
  PlaceRestoredByOwnerEvent,
  PlaceSubmittedEvent,
} from '../events/place-management.events.js';

export interface PlaceManagementSnapshot {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  lat: string;
  lng: string;
  categoryId: string;
  partnerId: string;
  destinationId?: string | null;
  status: PlaceManagementStatus;
  rejectionReason?: string | null;
  openingHours?: Record<string, unknown> | null;
  imageUrls?: string[] | null;
  thumbnailUrl?: string | null;
  googlePlaceId?: string | null;
  tagScores?: Record<string, number> | null;
  dataSource: PlaceDataSource;
  importBatchId?: string | null;
  deletedReason?: string | null;
  deletedByUserId?: string | null;
  deletedByRole?: PlaceDeletionActorRole | null;
  deletedAt?: Date | null;
}

export interface PlaceActorContext {
  userId: string;
  permissions: string[];
  partnerId?: string | null;
}

export interface UpdatePlaceInput {
  name?: string;
  description?: string | null;
  address?: string;
  lat?: string;
  lng?: string;
  categoryId?: string;
  destinationId?: string | null;
  openingHours?: Record<string, unknown> | null;
  imageUrls?: string[] | null;
  thumbnailUrl?: string | null;
  googlePlaceId?: string | null;
  tagScores?: Record<string, number> | null;
}

function hasAdminApprovePermission(actor: PlaceActorContext): boolean {
  return actor.permissions.includes('places_admin:approve');
}

function hasAdminDeletePermission(actor: PlaceActorContext): boolean {
  return actor.permissions.includes('places_admin:delete');
}

export class PlaceManagementAggregate {
  private readonly pendingEvents: DomainEvent[] = [];

  private constructor(private readonly snapshot: PlaceManagementSnapshot) {}

  static create(input: {
    id: string;
    name: string;
    description?: string | null;
    address: string;
    lat: string;
    lng: string;
    categoryId: string;
    partnerId: string;
    destinationId?: string | null;
    openingHours?: Record<string, unknown> | null;
    imageUrls?: string[] | null;
    thumbnailUrl?: string | null;
  }): PlaceManagementAggregate {
    return new PlaceManagementAggregate({
      id: input.id,
      name: input.name,
      description: input.description ?? null,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      categoryId: input.categoryId,
      partnerId: input.partnerId,
      destinationId: input.destinationId ?? null,
      status: PlaceManagementStatus.DRAFT,
      dataSource: PlaceDataSource.PARTNER_CREATED,
      openingHours: input.openingHours ?? null,
      imageUrls: input.imageUrls ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      rejectionReason: null,
      deletedReason: null,
      deletedByUserId: null,
      deletedByRole: null,
      deletedAt: null,
    });
  }

  static reconstitute(
    snapshot: PlaceManagementSnapshot,
  ): PlaceManagementAggregate {
    return new PlaceManagementAggregate(snapshot);
  }

  private ensureNotDeleted(): void {
    if (this.snapshot.deletedAt) {
      throw new PlaceDeletedException();
    }
  }

  private ensurePartnerOwnership(actor: PlaceActorContext): void {
    if (!actor.partnerId || actor.partnerId !== this.snapshot.partnerId) {
      throw new PlaceOwnershipException();
    }
  }

  private ensurePartnerOrAdminApproveOwnership(actor: PlaceActorContext): void {
    if (hasAdminApprovePermission(actor)) return;
    this.ensurePartnerOwnership(actor);
  }

  private ensureDeleted(): void {
    if (!this.snapshot.deletedAt) {
      throw new PlaceNotDeletedException();
    }
  }

  submitForReview(actor: PlaceActorContext): void {
    this.ensureNotDeleted();
    this.ensurePartnerOrAdminApproveOwnership(actor);
    if (
      this.snapshot.status !== PlaceManagementStatus.DRAFT &&
      this.snapshot.status !== PlaceManagementStatus.REJECTED
    ) {
      throw new InvalidWorkflowException(
        'place_can_only_submit_from_draft_or_rejected',
      );
    }
    this.snapshot.status = PlaceManagementStatus.PENDING_REVIEW;
    this.pendingEvents.push(
      new PlaceSubmittedEvent(
        this.snapshot.id,
        actor.userId,
        this.snapshot.partnerId,
      ),
    );
  }

  approve(actor: PlaceActorContext): void {
    this.ensureNotDeleted();
    if (!hasAdminApprovePermission(actor)) {
      throw new PlaceOwnershipException('place_approve_requires_permission');
    }
    if (this.snapshot.status !== PlaceManagementStatus.PENDING_REVIEW) {
      throw new InvalidWorkflowException(
        'place_can_only_approve_from_pending_review',
      );
    }
    this.snapshot.status = PlaceManagementStatus.APPROVED;
    this.snapshot.rejectionReason = null;
    this.pendingEvents.push(
      new PlaceApprovedEvent(
        this.snapshot.id,
        actor.userId,
        this.snapshot.partnerId,
      ),
    );
  }

  reject(actor: PlaceActorContext, reason: string): void {
    this.ensureNotDeleted();
    if (!hasAdminApprovePermission(actor)) {
      throw new PlaceOwnershipException('place_reject_requires_permission');
    }
    if (this.snapshot.status !== PlaceManagementStatus.PENDING_REVIEW) {
      throw new InvalidWorkflowException(
        'place_can_only_reject_from_pending_review',
      );
    }
    if (!reason.trim()) {
      throw new InvalidWorkflowException('place_reject_reason_required');
    }
    this.snapshot.status = PlaceManagementStatus.REJECTED;
    this.snapshot.rejectionReason = reason.trim();
    this.pendingEvents.push(
      new PlaceRejectedEvent(
        this.snapshot.id,
        actor.userId,
        this.snapshot.partnerId,
        this.snapshot.rejectionReason,
      ),
    );
  }

  update(actor: PlaceActorContext, input: UpdatePlaceInput): void {
    this.ensureNotDeleted();
    this.ensurePartnerOrAdminApproveOwnership(actor);
    if (
      this.snapshot.status !== PlaceManagementStatus.DRAFT &&
      this.snapshot.status !== PlaceManagementStatus.REJECTED
    ) {
      throw new InvalidWorkflowException(
        'place_can_only_update_in_draft_or_rejected',
      );
    }

    this.snapshot.name = input.name ?? this.snapshot.name;
    this.snapshot.description =
      input.description === undefined
        ? this.snapshot.description
        : input.description;
    this.snapshot.address = input.address ?? this.snapshot.address;
    this.snapshot.lat = input.lat ?? this.snapshot.lat;
    this.snapshot.lng = input.lng ?? this.snapshot.lng;
    this.snapshot.categoryId = input.categoryId ?? this.snapshot.categoryId;
    this.snapshot.destinationId =
      input.destinationId === undefined
        ? this.snapshot.destinationId
        : input.destinationId;
    this.snapshot.openingHours =
      input.openingHours === undefined
        ? this.snapshot.openingHours
        : input.openingHours;
    this.snapshot.imageUrls =
      input.imageUrls === undefined ? this.snapshot.imageUrls : input.imageUrls;
    this.snapshot.thumbnailUrl =
      input.thumbnailUrl === undefined
        ? this.snapshot.thumbnailUrl
        : input.thumbnailUrl;
    this.snapshot.googlePlaceId =
      input.googlePlaceId === undefined
        ? this.snapshot.googlePlaceId
        : input.googlePlaceId;
    this.snapshot.tagScores =
      input.tagScores === undefined ? this.snapshot.tagScores : input.tagScores;
  }

  deleteByOwner(actor: PlaceActorContext): void {
    this.ensureNotDeleted();
    this.ensurePartnerOwnership(actor);
    this.snapshot.deletedReason = 'owner_requested_delete';
    this.snapshot.deletedByUserId = actor.userId;
    this.snapshot.deletedByRole = PlaceDeletionActorRole.OWNER;
    this.pendingEvents.push(
      new PlaceDeletedByOwnerEvent(
        this.snapshot.id,
        actor.userId,
        this.snapshot.partnerId,
      ),
    );
  }

  deleteByAdmin(actor: PlaceActorContext, reason: string): void {
    this.ensureNotDeleted();
    if (!hasAdminDeletePermission(actor)) {
      throw new PlaceOwnershipException(
        'place_delete_requires_admin_permission',
      );
    }
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new InvalidWorkflowException('place_delete_reason_required');
    }
    this.snapshot.deletedReason = trimmedReason;
    this.snapshot.deletedByUserId = actor.userId;
    this.snapshot.deletedByRole = PlaceDeletionActorRole.ADMIN;
    this.pendingEvents.push(
      new PlaceDeletedByAdminEvent(
        this.snapshot.id,
        actor.userId,
        this.snapshot.partnerId,
        trimmedReason,
      ),
    );
  }

  restoreByOwner(actor: PlaceActorContext): void {
    this.ensureDeleted();
    this.ensurePartnerOwnership(actor);
    this.snapshot.deletedReason = null;
    this.snapshot.deletedByUserId = null;
    this.snapshot.deletedByRole = null;
    this.pendingEvents.push(
      new PlaceRestoredByOwnerEvent(
        this.snapshot.id,
        actor.userId,
        this.snapshot.partnerId,
      ),
    );
  }

  restoreByAdmin(actor: PlaceActorContext): void {
    this.ensureDeleted();
    if (!hasAdminDeletePermission(actor)) {
      throw new PlaceOwnershipException(
        'place_restore_requires_admin_permission',
      );
    }
    this.snapshot.deletedReason = null;
    this.snapshot.deletedByUserId = null;
    this.snapshot.deletedByRole = null;
    this.pendingEvents.push(
      new PlaceRestoredByAdminEvent(
        this.snapshot.id,
        actor.userId,
        this.snapshot.partnerId,
      ),
    );
  }

  toSnapshot(): PlaceManagementSnapshot {
    return { ...this.snapshot };
  }

  pullEvents(): DomainEvent[] {
    const out = [...this.pendingEvents];
    this.pendingEvents.length = 0;
    return out;
  }
}
