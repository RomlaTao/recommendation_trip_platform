import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeederModule } from './seeder.module';
import { RoleSeeder } from './seeders/role.seeder';
import { PermissionSeeder } from './seeders/permission.seeder';
import { RolePermissionSeeder } from './seeders/role-permission.seeder';
import { UserSeeder } from './seeders/user.seeder';

const logger = new Logger('Seed');

async function runSeeders(): Promise<void> {
  logger.log('Bootstrapping seeder application context...');

  const app = await NestFactory.createApplicationContext(SeederModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    // Order matters: roles → permissions → role-permissions → users
    await app.get(RoleSeeder).run();
    await app.get(PermissionSeeder).run();
    await app.get(RolePermissionSeeder).run();
    await app.get(UserSeeder).run();

    logger.log('All seeders completed successfully.');
  } catch (error) {
    logger.error('Seeding failed', error instanceof Error ? error.stack : error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSeeders();
