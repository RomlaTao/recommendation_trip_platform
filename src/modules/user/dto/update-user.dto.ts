import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for PATCH /users/me
 *
 * All fields are optional — clients send only what they want to change.
 * `email` and `role` are intentionally excluded: email changes need a
 * verification flow, and role changes require an admin endpoint.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john_doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'male' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  gender?: string;

  @ApiPropertyOptional({ example: '1999-10-20' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ example: 'I love hiking and local food.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bio?: string;
}
