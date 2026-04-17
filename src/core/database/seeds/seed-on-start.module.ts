import { Injectable, Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../../modules/permission/entities/role.entity';
import { Permission } from '../../../modules/permission/entities/permission.entity';
import { RolePermission } from '../../../modules/permission/entities/role-permission.entity';
import { UserRole } from '../../../modules/permission/entities/user-role.entity';
import { User } from '../../../modules/user/entities/user.entity';
import { RoleSeeder } from './seeders/role.seeder';
import { PermissionSeeder } from './seeders/permission.seeder';
import { RolePermissionSeeder } from './seeders/role-permission.seeder';
import { UserSeeder } from './seeders/user.seeder';

/**
 * Runs all seeders in dependency order right after the application has fully
 * initialised (all modules loaded, DB connection ready, ConfigService available).
 *
 * Activated only when SEED_ON_START=true — safe for local development,
 * should be disabled in staging/production.
 */
@Injectable()
class SeedOnStartService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedOnStartService.name);

  constructor(
    private readonly roleSeeder: RoleSeeder,
    private readonly permissionSeeder: PermissionSeeder,
    private readonly rolePermissionSeeder: RolePermissionSeeder,
    private readonly userSeeder: UserSeeder,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Running startup seeders...');
    try {
      await this.roleSeeder.run();
      await this.permissionSeeder.run();
      await this.rolePermissionSeeder.run();
      await this.userSeeder.run();
      this.logger.log('Startup seeding completed successfully.');
    } catch (error) {
      this.logger.error(
        'Startup seeding failed',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}

/**
 * Imported by AppModule only when SEED_ON_START=true.
 * Shares the root TypeORM connection already established by AppModule.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission, User, UserRole])],
  providers: [
    RoleSeeder,
    PermissionSeeder,
    RolePermissionSeeder,
    UserSeeder,
    SeedOnStartService,
  ],
})
export class SeedOnStartModule {}
