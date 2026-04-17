export interface RoleSeedData {
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
}

export const ROLES_SEED_DATA: RoleSeedData[] = [
  {
    code: 'ADMIN',
    name: 'Administrator',
    description:
      'Full system access — can manage all resources, users, roles, and permissions.',
    isSystem: true,
  },
  {
    code: 'MODERATOR',
    name: 'Moderator',
    description:
      'Content moderator — can review and manage trips, places, reviews, and categories.',
    isSystem: true,
  },
  {
    code: 'USER',
    name: 'Regular User',
    description:
      'Standard registered user — can browse content and manage own trips, reviews, and itineraries.',
    isSystem: false,
  },
];
