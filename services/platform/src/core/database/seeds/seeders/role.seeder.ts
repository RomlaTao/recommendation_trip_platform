import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../../modules/permission/entities/role.entity.js';
import { ROLES_SEED_DATA } from '../data/roles.data.js';

@Injectable()
export class RoleSeeder {
  private readonly logger = new Logger(RoleSeeder.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding roles...');

    for (const data of ROLES_SEED_DATA) {
      const exists = await this.roleRepository.findOne({
        where: { code: data.code },
      });

      if (exists) {
        this.logger.log(`  [SKIP] Role already exists: ${data.code}`);
        continue;
      }

      await this.roleRepository.save(this.roleRepository.create(data));
      this.logger.log(`  [OK]   Created role: ${data.code}`);
    }

    this.logger.log('Roles seeding done.\n');
  }
}
