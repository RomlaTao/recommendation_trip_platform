import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  resource: string;

  @ApiProperty({ example: 'read' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  action: string;

  @ApiPropertyOptional({ example: 'users:read' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  code?: string;
}
