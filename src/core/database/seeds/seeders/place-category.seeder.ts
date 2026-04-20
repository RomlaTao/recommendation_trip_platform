import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceCategoryOrmEntity } from '../../../../modules/place/management/infrastructure/persistence/typeorm/place-category.orm-entity.js';
import { readPlaceCsvRows } from '../utils/place-csv.util.js';

function toCategorySlug(categoryId: string): string {
  return `imported-${categoryId.slice(0, 8)}`;
}

@Injectable()
export class PlaceCategorySeeder {
  private readonly logger = new Logger(PlaceCategorySeeder.name);

  constructor(
    @InjectRepository(PlaceCategoryOrmEntity)
    private readonly categoryRepository: Repository<PlaceCategoryOrmEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding place categories from CSV...');
    const rows = readPlaceCsvRows();
    const categoryIds = Array.from(
      new Set(rows.map((r) => r.category_id).filter((id) => id?.length > 0)),
    );

    for (const categoryId of categoryIds) {
      const existing = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });
      if (existing) {
        continue;
      }

      await this.categoryRepository.save(
        this.categoryRepository.create({
          id: categoryId,
          name: `Imported category ${categoryId.slice(0, 8)}`,
          slug: toCategorySlug(categoryId),
        }),
      );
    }

    this.logger.log(`  [OK]   Ensured ${categoryIds.length} categories from CSV.`);
  }
}
