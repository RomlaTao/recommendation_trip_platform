import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Core database module placeholder.
 *
 * AppModule is currently configuring TypeORM via TypeOrmModule.forRootAsync.
 * This module keeps architecture consistent and can host DB providers later
 * (query runners, transaction helpers, custom repositories, etc.).
 */
@Global()
@Module({
  imports: [TypeOrmModule],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
