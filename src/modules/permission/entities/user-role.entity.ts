import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { User } from '../../user/entities/user.entity.js';
import { Role } from './role.entity.js';

@Entity('user_roles')
@Unique('UQ_user_role_pair', ['userId', 'roleId'])
@Index('IDX_user_roles_userId', ['userId'])
@Index('IDX_user_roles_roleId', ['roleId'])
export class UserRole extends BaseEntity {
  @ApiProperty({ example: '8f2c5c44-286e-4686-b3d0-77f08f0f6a13' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ example: '0e6f0a4d-e56d-462f-94fb-7df83007853a' })
  @Column({ type: 'uuid' })
  roleId: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;
}
