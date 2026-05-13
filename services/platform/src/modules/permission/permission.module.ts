import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity.js';
import { RolePermission } from './entities/role-permission.entity.js';
import { Role } from './entities/role.entity.js';
import { UserRole } from './entities/user-role.entity.js';
import { User } from '../user/entities/user.entity.js';
import { PermissionService } from './services/permission.service.js';
import { RoleService } from './services/role.service.js';
import { UserRoleService } from './services/user-role.service.js';
import { RolesController } from './controllers/roles.controller.js';
import { PermissionsController } from './controllers/permissions.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      UserRole,
      User,
    ]),
  ],
  controllers: [RolesController, PermissionsController],
  providers: [RoleService, PermissionService, UserRoleService],
  exports: [RoleService, PermissionService, UserRoleService],
})
export class PermissionModule {}
