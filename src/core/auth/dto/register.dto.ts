import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO — POST /auth/register
 *
 * `@Transform` on email normalises the value to lowercase before validation,
 * preventing duplicate accounts from differing in case (e.g. User@Email.com
 * vs user@email.com).
 */
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;


  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MinLength(1, { message: 'Username is required' })
  @MaxLength(100, { message: 'Username must not exceed 100 characters' })
  username: string;

  /**
   * Min 8 chars ensures basic brute-force resistance.
   * Add a regex pattern validator here if you want to enforce complexity rules.
   */
  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsString()
  passwordConfirmation: string;
}
