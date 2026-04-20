import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceCategoryOrmEntity } from '../../../../modules/place/management/infrastructure/persistence/typeorm/place-category.orm-entity.js';
import { readPlaceCategoryCsvRows } from '../utils/place-category-csv.util.js';
import { readPlaceCsvRows } from '../utils/place-csv.util.js';

function toCategorySlug(categoryName: string): string {
  return categoryName.trim().toLowerCase().replace(/[_\s]+/g, '-').replace(/[^a-z0-9-]/g, '');
}

@Injectable()
export class PlaceCategorySeeder {
  private readonly logger = new Logger(PlaceCategorySeeder.name);

  constructor(
    @InjectRepository(PlaceCategoryOrmEntity)
    private readonly categoryRepository: Repository<PlaceCategoryOrmEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding place categories from categories_for_places.csv...');
    const categoryRows = readPlaceCategoryCsvRows();
    const placeRows = readPlaceCsvRows();

    const categoryIdsFromPlaces = new Set(
      placeRows.map((r) => r.category_id).filter((id) => id?.length > 0),
    );
    const categoryIdsFromDataset = new Set(
      categoryRows.map((row) => row.id).filter((id) => id?.length > 0),
    );

    const missingCategoryIds = Array.from(categoryIdsFromPlaces).filter(
      (id) => !categoryIdsFromDataset.has(id),
    );
    if (missingCategoryIds.length > 0) {
      throw new Error(
        `categories_for_places.csv is missing category ids used by places CSV: ${missingCategoryIds.join(', ')}`,
      );
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of categoryRows) {
      if (!row.id || !row.name) {
        skipped += 1;
        continue;
      }
      const slug = toCategorySlug(row.name);
      if (!slug) {
        skipped += 1;
        continue;
      }
      const existing = await this.categoryRepository.findOne({
        where: { id: row.id },
      });
      if (!existing) {
        await this.categoryRepository.save(
          this.categoryRepository.create({
            id: row.id,
            name: row.name,
            slug,
          }),
        );
        created += 1;
        continue;
      }

      if (existing.name !== row.name || existing.slug !== slug) {
        existing.name = row.name;
        existing.slug = slug;
        await this.categoryRepository.save(existing);
        updated += 1;
        continue;
      }

      skipped += 1;
    }

    this.logger.log(
      `  [OK]   Categories processed: ${categoryRows.length} (created=${created}, updated=${updated}, skipped=${skipped})`,
    );
  }
}
