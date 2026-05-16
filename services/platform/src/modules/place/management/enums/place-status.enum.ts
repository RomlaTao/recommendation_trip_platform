/**
 * Lifecycle for partner-submitted places. CSV seed imports map `published` → APPROVED.
 */
export enum PlaceStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
