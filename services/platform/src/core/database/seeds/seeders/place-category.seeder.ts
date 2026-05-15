import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceCategoryOrmEntity } from '../../../../modules/place/management/infrastructure/persistence/typeorm/place-category.orm-entity.js';
import { readPlaceCategoryCsvRows } from '../utils/place-category-csv.util.js';
import { readPlaceCsvRows } from '../utils/place-csv.util.js';

function categoryCsvPathForLogs(): string {
  return process.env.CATEGORY_FOR_PLACES_CSV_PATH ?? '(unset)';
}

function toCategorySlug(categoryName: string): string {
  return categoryName
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

@Injectable()
export class PlaceCategorySeeder {
  private readonly logger = new Logger(PlaceCategorySeeder.name);

  constructor(
    @InjectRepository(PlaceCategoryOrmEntity)
    private readonly categoryRepository: Repository<PlaceCategoryOrmEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log(
      `Seeding place categories from ${categoryCsvPathForLogs()}...`,
    );
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
        `${categoryCsvPathForLogs()} is missing category ids used by places CSV: ${missingCategoryIds.join(', ')}`,
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
      const existingById = await this.categoryRepository.findOne({
        where: { id: row.id },
      });
      if (existingById) {
        if (
          existingById.name !== row.name ||
          existingById.slug !== slug
        ) {
          existingById.name = row.name;
          existingById.slug = slug;
          await this.categoryRepository.save(existingById);
          updated += 1;
        } else {
          skipped += 1;
        }
        continue;
      }

      const existingBySlug = await this.categoryRepository.findOne({
        where: { slug },
      });
      if (existingBySlug) {
        const legacyId = existingBySlug.id;
        await this.categoryRepository.manager.transaction(async (manager) => {
          await manager.query(
            `UPDATE place_categories SET slug = $1 WHERE id = $2`,
            [`${slug}-legacy-${legacyId}`, legacyId],
          );
          await manager.save(
            PlaceCategoryOrmEntity,
            manager.create(PlaceCategoryOrmEntity, {
              id: row.id,
              name: row.name,
              slug,
            }),
          );
          await manager.query(
            `UPDATE places SET "categoryId" = $1 WHERE "categoryId" = $2`,
            [row.id, legacyId],
          );
          await manager.delete(PlaceCategoryOrmEntity, { id: legacyId });
        });
        this.logger.log(
          `  [MIG]  Category id ${legacyId} → ${row.id} (${row.name})`,
        );
        updated += 1;
        continue;
      }

      await this.categoryRepository.save(
        this.categoryRepository.create({
          id: row.id,
          name: row.name,
          slug,
        }),
      );
      created += 1;
    }

    this.logger.log(
      `  [OK]   Categories processed: ${categoryRows.length} (created=${created}, updated=${updated}, skipped=${skipped})`,
    );
  }
}
