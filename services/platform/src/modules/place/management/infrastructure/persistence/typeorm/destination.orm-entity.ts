import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../../../core/database/base.entity.js';

@Entity('destinations')
export class DestinationOrmEntity extends BaseEntity {
  @ApiProperty({ example: 'vung-tau' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @ApiProperty({ example: 'Vũng Tàu' })
  @Column({ type: 'varchar', length: 255 })
  name: string;
}
