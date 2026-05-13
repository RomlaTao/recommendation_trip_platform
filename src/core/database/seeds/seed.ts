import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeederModule } from './seeder.module';
import { RoleSeeder } from './seeders/role.seeder';
import { PermissionSeeder } from './seeders/permission.seeder';
import { RolePermissionSeeder } from './seeders/role-permission.seeder';
import { UserSeeder } from './seeders/user.seeder';
import { PartnerSeeder } from './seeders/partner.seeder.js';
import { PlaceCategorySeeder } from './seeders/place-category.seeder.js';
import { PlaceSeeder } from './seeders/place.seeder.js';
import { NotificationPreferenceSeeder } from './seeders/notification-preference.seeder.js';

const logger = new Logger('Seed');

async function runSeeders(): Promise<void> {
  logger.log('Bootstrapping seeder application context...');

  const app = await NestFactory.createApplicationContext(SeederModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    // Order matters: auth seeds first, then place ownership/taxonomy/data import.
    await app.get(RoleSeeder).run();
    await app.get(PermissionSeeder).run();
    await app.get(RolePermissionSeeder).run();
    await app.get(UserSeeder).run();
    await app.get(PartnerSeeder).run();
    await app.get(PlaceCategorySeeder).run();
    await app.get(PlaceSeeder).run();
    await app.get(NotificationPreferenceSeeder).run();

    logger.log('All seeders completed successfully.');
  } catch (error) {
    logger.error(
      'Seeding failed',
      error instanceof Error ? error.stack : error,
    );
    process.exit(1);
  } finally {
    await app.close();
  }
}

void runSeeders();
