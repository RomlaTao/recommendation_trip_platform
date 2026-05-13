import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceOrmEntity } from '../../../../modules/place/management/infrastructure/persistence/typeorm/place.orm-entity.js';
import { PartnerOrmEntity } from '../../../../modules/place/management/infrastructure/persistence/typeorm/partner.orm-entity.js';
import { PlaceCategoryOrmEntity } from '../../../../modules/place/management/infrastructure/persistence/typeorm/place-category.orm-entity.js';
import { PlaceDataSource } from '../../../../modules/place/management/enums/place-data-source.enum.js';
import { PlaceStatus } from '../../../../modules/place/management/enums/place-status.enum.js';
import {
  parseJsonField,
  readPlaceCsvRows,
  type PlaceCsvRow,
} from '../utils/place-csv.util.js';
import { PLATFORM_PARTNER_SLUG } from './partner.seeder.js';

function mapStatus(input: string): PlaceStatus {
  if (input?.toLowerCase() === 'published') return PlaceStatus.APPROVED;
  return PlaceStatus.DRAFT;
}

function toNullableString(value: string): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

@Injectable()
export class PlaceSeeder {
  private readonly logger = new Logger(PlaceSeeder.name);

  constructor(
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
    @InjectRepository(PartnerOrmEntity)
    private readonly partnerRepository: Repository<PartnerOrmEntity>,
    @InjectRepository(PlaceCategoryOrmEntity)
    private readonly categoryRepository: Repository<PlaceCategoryOrmEntity>,
  ) {}

  private async findOrCreateTarget(
    row: PlaceCsvRow,
  ): Promise<PlaceOrmEntity | null> {
    const byId = await this.placeRepository.findOne({ where: { id: row.id } });
    if (byId) return byId;

    if (row.google_place_id) {
      const byGooglePlaceId = await this.placeRepository.findOne({
        where: { googlePlaceId: row.google_place_id },
      });
      if (byGooglePlaceId) return byGooglePlaceId;
    }
    return null;
  }

  async run(): Promise<void> {
    this.logger.log('Seeding places from CSV...');

    const partner = await this.partnerRepository.findOne({
      where: { slug: PLATFORM_PARTNER_SLUG },
    });
    if (!partner) {
      this.logger.warn(
        '  [WARN] Platform partner missing. Run PartnerSeeder first.',
      );
      return;
    }

    const rows = readPlaceCsvRows();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.id || !row.category_id || !row.lat || !row.lng) {
        skipped += 1;
        continue;
      }

      const category = await this.categoryRepository.findOne({
        where: { id: row.category_id },
      });
      if (!category) {
        skipped += 1;
        continue;
      }

      const place =
        (await this.findOrCreateTarget(row)) ?? this.placeRepository.create();
      const wasNew = !place.id;

      if (wasNew) {
        place.id = row.id;
      }
      place.name = row.name;
      place.address = row.address;
      place.description = toNullableString(row.description);
      place.lat = row.lat;
      place.lng = row.lng;
      place.googlePlaceId = toNullableString(row.google_place_id);
      place.seedAverageRating =
        toNullableNumber(row.average_rating)?.toFixed(2) ?? null;
      place.seedReviewCount = toNullableNumber(row.review_count);
      place.tagScores = parseJsonField<Record<string, number>>(row.tag_scores);
      place.status = mapStatus(row.status);
      place.imageUrls = parseJsonField<string[]>(row.image_urls);
      place.thumbnailUrl = toNullableString(row.thumbnail);
      place.partnerId = partner.id;
      place.categoryId = category.id;
      place.dataSource = PlaceDataSource.CSV_SEED;
      place.importBatchId = 'vungtau-csv-initial';
      place.deletedReason = null;
      place.deletedByUserId = null;
      place.deletedByRole = null;
      place.averageRating ??= null;
      place.reviewCount ??= 0;

      await this.placeRepository.save(place);
      if (wasNew) created += 1;
      else updated += 1;
    }

    this.logger.log(
      `  [OK]   Places processed: ${rows.length} (created=${created}, updated=${updated}, skipped=${skipped})`,
    );
  }
}
