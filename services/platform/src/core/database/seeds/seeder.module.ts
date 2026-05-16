import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig, { DatabaseConfig } from '../../config/database.config.js';
import { Role } from '../../../modules/permission/entities/role.entity.js';
import { Permission } from '../../../modules/permission/entities/permission.entity.js';
import { RolePermission } from '../../../modules/permission/entities/role-permission.entity.js';
import { UserRole } from '../../../modules/permission/entities/user-role.entity.js';
import { User } from '../../../modules/user/entities/user.entity.js';
import { PartnerOrmEntity } from '../../../modules/place/management/infrastructure/persistence/typeorm/partner.orm-entity.js';
import { DestinationOrmEntity } from '../../../modules/place/management/infrastructure/persistence/typeorm/destination.orm-entity.js';
import { PlaceCategoryOrmEntity } from '../../../modules/place/management/infrastructure/persistence/typeorm/place-category.orm-entity.js';
import { PlaceOrmEntity } from '../../../modules/place/management/infrastructure/persistence/typeorm/place.orm-entity.js';
import { RoleSeeder } from './seeders/role.seeder.js';
import { PermissionSeeder } from './seeders/permission.seeder.js';
import { RolePermissionSeeder } from './seeders/role-permission.seeder.js';
import { UserSeeder } from './seeders/user.seeder.js';
import { PartnerSeeder } from './seeders/partner.seeder.js';
import { DestinationSeeder } from './seeders/destination.seeder.js';
import { PlaceCategorySeeder } from './seeders/place-category.seeder.js';
import { PlaceSeeder } from './seeders/place.seeder.js';
import { NotificationPreferenceEntity } from '../../../modules/notification/entities/notification-preference.entity.js';
import { NotificationPreferenceSeeder } from './seeders/notification-preference.seeder.js';

/**
 * Standalone NestJS module used only by the CLI seed runner (seed.ts).
 * Creates its own DB connection and ConfigModule so it can run independently
 * of the main application.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const db = configService.get<DatabaseConfig>('database')!;
        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          entities: [
            Role,
            Permission,
            RolePermission,
            User,
            UserRole,
            PartnerOrmEntity,
            DestinationOrmEntity,
            PlaceCategoryOrmEntity,
            PlaceOrmEntity,
            NotificationPreferenceEntity,
          ],
          synchronize: false,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      User,
      UserRole,
      PartnerOrmEntity,
      DestinationOrmEntity,
      PlaceCategoryOrmEntity,
      PlaceOrmEntity,
      NotificationPreferenceEntity,
    ]),
  ],
  providers: [
    RoleSeeder,
    PermissionSeeder,
    RolePermissionSeeder,
    UserSeeder,
    PartnerSeeder,
    PlaceCategorySeeder,
    DestinationSeeder,
    PlaceSeeder,
    NotificationPreferenceSeeder,
  ],
})
export class SeederModule {}
