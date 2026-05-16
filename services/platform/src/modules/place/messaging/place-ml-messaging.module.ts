import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaceMlOutboxOrmEntity } from './place-ml-outbox.orm-entity.js';
import { PlaceMlOutboxRelayService } from './place-ml-outbox-relay.service.js';
import { PlaceMlOutboxWriterService } from './place-ml-outbox-writer.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([PlaceMlOutboxOrmEntity])],
  providers: [PlaceMlOutboxWriterService, PlaceMlOutboxRelayService],
  exports: [PlaceMlOutboxWriterService, TypeOrmModule],
})
export class PlaceMlMessagingModule {}
