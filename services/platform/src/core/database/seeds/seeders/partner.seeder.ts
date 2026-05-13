import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerOrmEntity } from '../../../../modules/place/management/infrastructure/persistence/typeorm/partner.orm-entity.js';

export const PLATFORM_PARTNER_SLUG = 'platform-catalog';

@Injectable()
export class PartnerSeeder {
  private readonly logger = new Logger(PartnerSeeder.name);

  constructor(
    @InjectRepository(PartnerOrmEntity)
    private readonly partnerRepository: Repository<PartnerOrmEntity>,
  ) {}

  async run(): Promise<PartnerOrmEntity> {
    this.logger.log('Seeding partner...');

    const existing = await this.partnerRepository.findOne({
      where: { slug: PLATFORM_PARTNER_SLUG },
    });
    if (existing) {
      this.logger.log(
        `  [SKIP] Partner already exists: ${PLATFORM_PARTNER_SLUG}`,
      );
      return existing;
    }

    const created = await this.partnerRepository.save(
      this.partnerRepository.create({
        name: 'Platform Catalog',
        slug: PLATFORM_PARTNER_SLUG,
      }),
    );
    this.logger.log(`  [OK]   Created partner: ${PLATFORM_PARTNER_SLUG}`);
    return created;
  }
}
