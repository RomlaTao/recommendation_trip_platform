import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DestinationOrmEntity } from '../../../../modules/place/management/infrastructure/persistence/typeorm/destination.orm-entity.js';
import { readDestinationCsvRows } from '../utils/destination-csv.util.js';
import { readPlaceCsvRows } from '../utils/place-csv.util.js';

function destinationCsvPathForLogs(): string {
  return process.env.DESTINATION_CSV_PATH ?? '(unset)';
}

@Injectable()
export class DestinationSeeder {
  private readonly logger = new Logger(DestinationSeeder.name);

  constructor(
    @InjectRepository(DestinationOrmEntity)
    private readonly destinationRepository: Repository<DestinationOrmEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log(
      `Seeding destinations from ${destinationCsvPathForLogs()}...`,
    );

    const destinationRows = readDestinationCsvRows();
    const placeRows = readPlaceCsvRows();

    const destinationIdsFromPlaces = new Set(
      placeRows
        .map((r) => r.destination_id)
        .filter((id) => id?.trim().length > 0),
    );
    const destinationIdsFromDataset = new Set(
      destinationRows.map((row) => row.id).filter((id) => id?.length > 0),
    );

    const missingDestinationIds = Array.from(destinationIdsFromPlaces).filter(
      (id) => !destinationIdsFromDataset.has(id),
    );
    if (missingDestinationIds.length > 0) {
      throw new Error(
        `${destinationCsvPathForLogs()} is missing destination ids used by places CSV: ${missingDestinationIds.join(', ')}`,
      );
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of destinationRows) {
      if (!row.id || !row.slug || !row.name) {
        skipped += 1;
        continue;
      }

      const existing = await this.destinationRepository.findOne({
        where: { id: row.id },
      });
      if (!existing) {
        await this.destinationRepository.save(
          this.destinationRepository.create({
            id: row.id,
            slug: row.slug,
            name: row.name,
          }),
        );
        created += 1;
        continue;
      }

      if (existing.slug !== row.slug || existing.name !== row.name) {
        existing.slug = row.slug;
        existing.name = row.name;
        await this.destinationRepository.save(existing);
        updated += 1;
        continue;
      }

      skipped += 1;
    }

    this.logger.log(
      `  [OK]   Destinations processed: ${destinationRows.length} (created=${created}, updated=${updated}, skipped=${skipped})`,
    );
  }
}
