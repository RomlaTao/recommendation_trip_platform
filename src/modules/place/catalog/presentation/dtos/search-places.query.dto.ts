import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { PlaceCatalogSort } from '../../application/ports/place-catalog-repository.port.js';

const sortValues: PlaceCatalogSort[] = ['newest', 'rating_desc', 'name_asc'];

export class SearchPlacesQueryDto {
  @ApiPropertyOptional({ example: 'coffee' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 4.2, minimum: 0, maximum: 5 })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ enum: sortValues, default: 'newest' })
  @IsOptional()
  @IsIn(sortValues)
  sort: PlaceCatalogSort = 'newest';

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 50 })
  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
