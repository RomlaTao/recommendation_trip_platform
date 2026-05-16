import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PlaceRegistrationRequestStatus } from '../../enums/place-registration-request-status.enum.js';

export class ListPlaceRegistrationRequestsQueryDto {
  @IsOptional()
  @IsEnum(PlaceRegistrationRequestStatus)
  status?: PlaceRegistrationRequestStatus;

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
