/** Domain aggregate label stored in outbox. */
export const PLACE_ML_AGGREGATE_TYPE = 'PLACE' as const;

/** Wire + outbox envelope schema version (bump when payload shape changes). */
export const PLACE_ML_PROJECTION_SCHEMA_VERSION = 1 as const;

/** Single event type for ML read-model upserts (routing key default). */
export const PLACE_ML_PROJECTION_EVENT_TYPE = 'place.projection.v1' as const;
