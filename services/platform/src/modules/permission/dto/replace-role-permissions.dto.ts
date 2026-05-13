import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReplaceRolePermissionsDto {
  @ApiProperty({
    example: [
      '2c7f6de4-2bf0-4230-83a8-169d27565504',
      '0e6f0a4d-e56d-462f-94fb-7df83007853a',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}
