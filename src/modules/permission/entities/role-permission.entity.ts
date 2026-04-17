import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../core/database/base.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity('role_permissions')
@Unique('UQ_role_permission_pair', ['roleId', 'permissionId'])
@Index('IDX_role_permissions_roleId', ['roleId'])
@Index('IDX_role_permissions_permissionId', ['permissionId'])
export class RolePermission extends BaseEntity {
  @ApiProperty({ example: '0e6f0a4d-e56d-462f-94fb-7df83007853a' })
  @Column({ type: 'uuid' })
  roleId: string;

  @ApiProperty({ example: '2c7f6de4-2bf0-4230-83a8-169d27565504' })
  @Column({ type: 'uuid' })
  permissionId: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;
}
