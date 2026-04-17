/**
 * Shape of the data encoded inside a JWT.
 *
 * Design rationale:
 * - Keep the payload lean — only include what Guards/Decorators need at runtime
 *   without an extra DB round-trip (sub, email, role are sufficient for most
 *   authorization decisions).
 * - `sub` follows the JWT RFC 7519 convention for the principal identifier.
 * - `type` distinguishes access tokens from refresh tokens so that a refresh
 *   token cannot be accidentally accepted by the standard JwtAuthGuard.
 */
export interface JwtPayload {
  /** User UUID — maps to User.id */
  sub: string;
  email: string;
  roleCode?: string;
  roleCodes?: string[];
  /** Discriminator to prevent cross-use between token types */
  type: 'access' | 'refresh';
}

/**
 * User object attached by JwtStrategy onto `req.user`.
 * Includes dynamic permissions resolved from the current role.
 */
export interface JwtRequestUser extends JwtPayload {
  permissions: string[];
}
