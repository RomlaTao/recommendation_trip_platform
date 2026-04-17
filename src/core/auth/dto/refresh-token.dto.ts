import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO — POST /auth/refresh
 *
 * The refresh token is sent in the request body (not a cookie) for simplicity.
 * If you later switch to HttpOnly cookie rotation, remove this DTO and read
 * the token from `req.cookies` in the controller instead.
 */
export class RefreshTokenDto {
  @ApiProperty({ example: '3adfe58c0b4b7e...random-hex-token...' })
  @IsString()
  @MinLength(32)
  refreshToken: string;
}
