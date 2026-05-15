import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PlaceStatus } from '../../enums/place-status.enum.js';

export class AdminListPlacesQueryDto {
  @IsOptional()
  @IsEnum(PlaceStatus)
  status?: PlaceStatus;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  includeDeleted?: boolean;

  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => Number(value ?? 100))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 100;
}
