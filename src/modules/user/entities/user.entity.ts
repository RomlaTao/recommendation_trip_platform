import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
// `import type` required: isolatedModules + emitDecoratorMetadata cannot emit
// runtime metadata for type aliases used in decorated signatures.
import type { SsoProvider } from '../interfaces/user-identity.interface.js';

/**
 * User Entity
 *
 * Design rationale:
 * - Extends BaseEntity to get UUID primary key + audit timestamps + soft-delete.
 * - `passwordHash` is nullable to accommodate two authentication modes:
 *     • Local auth:  passwordHash is set, provider/providerId are null.
 *     • SSO auth:    passwordHash is null, provider/providerId are set.
 *     • Linked:      both are set (user registered locally, later linked to SSO).
 * - `@Exclude()` on sensitive fields works with ClassSerializerInterceptor or
 *   plainToInstance({ excludeExtraneousValues: true }) — never returned to client.
 * - `@Index` on email: critical for login lookups; unique enforced at DB level.
 */
@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ example: 'user@example.com' })
  @Index()
  @Column({ type: 'varchar', unique: true, length: 255 })
  email: string;

  /**
   * Null for SSO-only accounts; bcrypt hash for local-auth accounts.
   * Never serialised to the client (see @Exclude).
   */
  @Exclude()
  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash?: string;

  @ApiPropertyOptional({ example: 'john_doe' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  username?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'male' })
  @Column({ type: 'varchar', nullable: true })
  gender?: string;

  @ApiPropertyOptional({ example: '1999-10-20' })
  @Column({ type: 'varchar', nullable: true })
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City' })
  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @ApiPropertyOptional({ example: 'I love hiking and local food.' })
  @Column({ type: 'varchar', nullable: true })
  bio?: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // ── SSO / OAuth fields ──────────────────────────────────────────────────────
  // Reserved for JIT provisioning (IUserIdentityProvider). These remain null
  // for pure local-auth users. When an SSO link is created, both fields are set.

  @ApiPropertyOptional({ example: 'google' })
  @Column({ type: 'varchar', nullable: true })
  provider?: SsoProvider;

  /**
   * The stable unique ID from the external provider (e.g. Google `sub` claim).
   * Combined index with `provider` to look up SSO users efficiently.
   */
  @ApiPropertyOptional({ example: '110123456789012345678' })
  @Index()
  @Column({ type: 'varchar', nullable: true })
  providerId?: string;
}
