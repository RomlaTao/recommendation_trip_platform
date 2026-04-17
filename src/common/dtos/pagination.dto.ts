import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

/**
 * Shared pagination DTO.
 * Usage in controller: @Query() query: PaginationDto
 */
export class PaginationDto {
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
