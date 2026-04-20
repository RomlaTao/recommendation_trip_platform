import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreatePlaceDto {
  @ApiProperty({ example: 'Sunset Beach Cafe' })
  @IsString()
  @Length(1, 500)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: '15 Tran Phu, Vung Tau' })
  @IsString()
  @Length(1, 1000)
  address: string;

  @ApiProperty({ example: '10.3484864' })
  @IsLatitude()
  lat: string;

  @ApiProperty({ example: '107.0761821' })
  @IsLongitude()
  lng: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Partner ownership for the created place.',
  })
  @IsUUID()
  partnerId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[] | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string | null;
}
