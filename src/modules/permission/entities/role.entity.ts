import { Column, Entity, Index, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../core/database/base.entity';
import { RolePermission } from './role-permission.entity';

/**
 * Backward-compatible enum still used by current auth/user flow.
 * This can be migrated to role records later.
 */

@Entity('roles')
export class Role extends BaseEntity {
  @ApiProperty({ example: 'ADMIN' })
  @Index({ unique: true })
  @Column({ length: 50 })
  code: string;

  @ApiProperty({ example: 'Administrator' })
  @Column({ length: 100 })
  name: string;

  @ApiPropertyOptional({ example: 'Full system access role' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isSystem: boolean;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];
}