import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity.js';

export const USER_TOKEN_TYPES = {
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  VERIFY_EMAIL: 'VERIFY_EMAIL',
} as const;

export type UserTokenType = (typeof USER_TOKEN_TYPES)[keyof typeof USER_TOKEN_TYPES];

@Entity('user_tokens')
@Index('IDX_user_tokens_user_type', ['userId', 'type'])
@Index('IDX_user_tokens_expires_at', ['expiresAt'])
@Index('IDX_user_tokens_active_lookup', ['type', 'revokedAt', 'consumedAt', 'expiresAt'])
export class UserTokenEntity {
  @ApiProperty({ example: '58ea370c-febc-4db0-98fc-bf1936118226' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '8f2c5c44-286e-4686-b3d0-77f08f0f6a13' })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: 'a1f0ee8bf9f2a8f3320f4f6f6f8307fdbf695e5eb220376f2ff2a3f2f0fef79f' })
  @Column({ type: 'varchar', unique: true, length: 128 })
  tokenHash: string;

  @ApiProperty({ example: USER_TOKEN_TYPES.REFRESH_TOKEN, enum: Object.values(USER_TOKEN_TYPES) })
  @Column({ type: 'varchar', length: 32 })
  type: UserTokenType;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 ...' })
  @Column({ type: 'varchar', nullable: true })
  userAgent?: string | null;

  @ApiPropertyOptional({ example: '192.168.1.10' })
  @Column({ type: 'varchar', nullable: true })
  ipAddress?: string | null;

  @ApiProperty({ example: '2026-04-17T10:00:00.000Z' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ApiPropertyOptional({ example: '2026-04-17T10:00:00.000Z' })
  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-04-17T10:00:00.000Z' })
  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-04-17T10:00:00.000Z' })
  @Column({ type: 'timestamptz', nullable: true })
  consumedAt?: Date | null;
}
