import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRoleSummaryDto {
  @ApiProperty({ example: '8f2c5c44-286e-4686-b3d0-77f08f0f6a13' })
  userId: string;

  @ApiProperty({ example: ['USER', 'MODERATOR'], type: [String] })
  roleCodes: string[];

  @ApiPropertyOptional({ example: 'MODERATOR' })
  primaryRoleCode?: string;
}
