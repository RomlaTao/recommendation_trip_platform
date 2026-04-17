import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AssignUserRolesDto {
  @ApiProperty({ example: ['USER', 'MODERATOR'], type: [String] })
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(50, { each: true })
  roleCodes: string[];

  @ApiPropertyOptional({ example: 'MODERATOR' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  primaryRoleCode?: string;
}
