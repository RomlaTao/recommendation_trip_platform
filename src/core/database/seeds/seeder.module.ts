import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig, {
  DatabaseConfig,
} from '../../config/database.config';
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
          entities: [Role, Permission, RolePermission, User, UserRole],
          synchronize: false,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Role, Permission, RolePermission, User, UserRole]),
  ],
  providers: [RoleSeeder, PermissionSeeder, RolePermissionSeeder, UserSeeder],
})
export class SeederModule {}
