import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Administrator' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Full system access' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
