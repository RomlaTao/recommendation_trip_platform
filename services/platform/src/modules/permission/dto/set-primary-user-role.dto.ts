import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SetPrimaryUserRoleDto {
  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  roleCode: string;
}
