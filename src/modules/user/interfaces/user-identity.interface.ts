import { User } from '../entities/user.entity';

/**
 * SSO / JIT Provisioning Extension Point
 *
 * Design rationale:
 * - This interface is the "seam" for future Single Sign-On and Just-In-Time
 *   provisioning flows (Google OAuth, Microsoft Entra, Okta SAML, etc.).
 * - When an SSO strategy is added, it calls `findOrCreateFromExternalIdentity`
 *   on UsersService. If the user already exists (matched by email or providerId),
 *   the account is returned; otherwise a new account is JIT-provisioned with a
 *   null passwordHash (SSO-only accounts cannot use password login).
 * - `ExternalUserProfile` is a normalised DTO — each OAuth/SAML adapter maps
 *   its provider-specific profile to this shape before calling the service,
 *   keeping the Users domain completely decoupled from Passport strategy details.
 *
 * To add a new provider:
 *   1. Create a new Passport strategy in auth/strategies/
 *   2. Map the provider profile to ExternalUserProfile
 *   3. Call usersService.findOrCreateFromExternalIdentity(profile)
 *   — No changes required in UsersService or the entity.
 */

export type SsoProvider = 'google' | 'microsoft' | 'okta';

export interface ExternalUserProfile {
  /** Identifies which OAuth/SAML provider issued this profile */
  provider: SsoProvider;
  /** The stable, unique ID from the external provider (e.g. Google sub claim) */
  providerId: string;
  email: string;
  username?: string;
  avatarUrl?: string;
}

/**
 * Contract that UsersService fulfils so that any future SSO Passport strategy
 * can call JIT provisioning without coupling to UsersService directly
 * (if you ever split into micro-services, extract this to a shared interface).
 */
export interface IUserIdentityProvider {
  findOrCreateFromExternalIdentity(
    profile: ExternalUserProfile,
  ): Promise<User>;
}
