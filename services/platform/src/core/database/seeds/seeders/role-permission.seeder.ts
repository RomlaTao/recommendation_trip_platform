import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../../modules/permission/entities/role.entity';
import { Permission } from '../../../../modules/permission/entities/permission.entity';
import { RolePermission } from '../../../../modules/permission/entities/role-permission.entity';
import { ROLE_PERMISSION_MAP } from '../data/permissions.data';

@Injectable()
export class RolePermissionSeeder {
  private readonly logger = new Logger(RolePermissionSeeder.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding role-permissions...');

    const roles = await this.roleRepository.find();
    const permissions = await this.permissionRepository.find();

    const roleMap = new Map(roles.map((r) => [r.code, r]));
    const permissionMap = new Map(permissions.map((p) => [p.code, p]));

    for (const [roleCode, permissionCodes] of Object.entries(
      ROLE_PERMISSION_MAP,
    )) {
      const role = roleMap.get(roleCode);
      if (!role) {
        this.logger.warn(
          `  [WARN] Role not found, skipping assignments: ${roleCode}`,
        );
        continue;
      }

      this.logger.log(`  Assigning permissions to role: ${roleCode}`);
      let created = 0;
      let skipped = 0;

      for (const permCode of permissionCodes) {
        const permission = permissionMap.get(permCode);
        if (!permission) {
          this.logger.warn(
            `    [WARN] Permission not found, skipping: ${permCode}`,
          );
          continue;
        }

        const exists = await this.rolePermissionRepository.findOne({
          where: { roleId: role.id, permissionId: permission.id },
        });

        if (exists) {
          skipped++;
          continue;
        }

        await this.rolePermissionRepository.save(
          this.rolePermissionRepository.create({
            roleId: role.id,
            permissionId: permission.id,
          }),
        );
        created++;
      }

      this.logger.log(
        `    → Created: ${created}, Skipped (already exist): ${skipped}`,
      );
    }

    this.logger.log('Role-permissions seeding done.\n');
  }
}
