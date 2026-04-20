import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class ApprovePlaceDto {
  @ApiPropertyOptional({ description: 'Optional moderation note for auditing.' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  note?: string;
}
