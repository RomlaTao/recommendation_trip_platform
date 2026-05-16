import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../../../modules/permission/entities/permission.entity.js';
import { PERMISSIONS_SEED_DATA } from '../data/permissions.data.js';

@Injectable()
export class PermissionSeeder {
  private readonly logger = new Logger(PermissionSeeder.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding permissions...');

    for (const data of PERMISSIONS_SEED_DATA) {
      const exists = await this.permissionRepository.findOne({
        where: { code: data.code },
      });

      if (exists) {
        this.logger.log(`  [SKIP] Permission already exists: ${data.code}`);
        continue;
      }

      await this.permissionRepository.save(
        this.permissionRepository.create(data),
      );
      this.logger.log(`  [OK]   Created permission: ${data.code}`);
    }

    this.logger.log('Permissions seeding done.\n');
  }
}
