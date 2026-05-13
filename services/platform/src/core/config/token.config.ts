import { registerAs } from '@nestjs/config';

/**
 * Typed config namespace: 'token'
 *
 * Design rationale:
 * - Two separate secrets (access vs refresh) follow the principle of least
 *   privilege: a leaked access secret cannot be used to forge refresh tokens.
 * - Keeping expiry strings here (not hardcoded in AuthService) means all
 *   token lifetime decisions live in one place and are easily adjusted via env.
 */
export interface TokenConfig {
  accessSecret: string;
  accessExpiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export default registerAs(
  'token',
  (): TokenConfig => ({
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'fallback_access_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'fallback_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  }),
);
