import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class DeletePlaceDto {
  @ApiProperty({
    example: 'Duplicate listing, violates catalog quality policy',
  })
  @IsString()
  @Length(3, 1000)
  reason: string;
}
