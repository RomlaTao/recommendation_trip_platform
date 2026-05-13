import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../core/database/base.entity';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
@Unique('UQ_permissions_resource_action', ['resource', 'action'])
export class Permission extends BaseEntity {
  @ApiProperty({ example: 'users:read' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  code: string;

  @ApiProperty({ example: 'users' })
  @Column({ type: 'varchar', length: 80 })
  resource: string;

  @ApiProperty({ example: 'read' })
  @Column({ type: 'varchar', length: 80 })
  action: string;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermission[];
}
