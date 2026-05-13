import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../../../../core/database/base.entity.js';

/**
 * Hierarchical place taxonomy. Root categories have `parentId = null`.
 */
@Entity('place_categories')
@Index('IDX_place_categories_name', ['name'])
export class PlaceCategoryOrmEntity extends BaseEntity {
  @ApiProperty({ example: 'Park' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ example: 'park' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @ApiPropertyOptional()
  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;

  @ApiPropertyOptional()
  @ManyToOne(() => PlaceCategoryOrmEntity, (c) => c.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent?: PlaceCategoryOrmEntity | null;

  @ApiPropertyOptional()
  @OneToMany(() => PlaceCategoryOrmEntity, (c) => c.parent)
  children?: PlaceCategoryOrmEntity[];
}
