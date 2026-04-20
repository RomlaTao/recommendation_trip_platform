import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../../../core/database/base.entity.js';

/**
 * Business partner or synthetic platform owner for catalog rows (e.g. CSV seed).
 */
@Entity('partners')
export class PartnerOrmEntity extends BaseEntity {
  @ApiProperty({ example: 'Platform catalog' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ example: 'platform-catalog' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;
}
