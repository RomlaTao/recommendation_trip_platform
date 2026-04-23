export interface PermissionSeedData {
  code: string;
  resource: string;
  action: string;
}

/**
 * Resources and their available CRUD actions.
 * Resources reflect the core domain of the Recommendation Trip Platform.
 */
const RESOURCE_ACTIONS: Record<string, string[]> = {
  users: ['read', 'create', 'update', 'delete'],
  roles: ['read', 'create', 'update', 'delete'],
  permissions: ['read', 'create', 'update', 'delete'],
  trips: ['read', 'create', 'update', 'delete'],
  places_catalog: ['read'],
  places_partner: ['read', 'create', 'update', 'delete'],
  places_admin: ['read', 'approve', 'delete'],
  reviews: ['read', 'create', 'update', 'delete'],
  itineraries: ['read', 'create', 'update', 'delete'],
  categories: ['read', 'create', 'update', 'delete'],
};

export const PERMISSIONS_SEED_DATA: PermissionSeedData[] = Object.entries(
  RESOURCE_ACTIONS,
).flatMap(([resource, actions]) =>
  actions.map((action) => ({
    code: `${resource}:${action}`,
    resource,
    action,
  })),
);

/**
 * Permission codes assigned to each role.
 *
 * - ADMIN:     Full access to every resource.
 * - MODERATOR: Read access everywhere + full CRUD on content resources.
 * - USER:      Read public content + self-service CRUD on own content.
 */
export const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  ADMIN: PERMISSIONS_SEED_DATA.map((p) => p.code),

  MODERATOR: [
    'users:read',
    'roles:read',
    'permissions:read',
    'trips:read',
    'trips:create',
    'trips:update',
    'trips:delete',
    'places_catalog:read',
    'places_partner:read',
    'places_partner:create',
    'places_partner:update',
    'places_partner:delete',
    'places_admin:read',
    'places_admin:approve',
    'places_admin:delete',
    'reviews:read',
    'reviews:create',
    'reviews:update',
    'reviews:delete',
    'itineraries:read',
    'itineraries:create',
    'itineraries:update',
    'itineraries:delete',
    'categories:read',
    'categories:create',
    'categories:update',
    'categories:delete',
  ],

  USER: [
    'trips:read',
    'trips:create',
    'trips:update',
    'trips:delete',
    'places_catalog:read',
    'reviews:read',
    'reviews:create',
    'reviews:update',
    'reviews:delete',
    'itineraries:read',
    'itineraries:create',
    'itineraries:update',
    'itineraries:delete',
    'categories:read',
  ],
};
