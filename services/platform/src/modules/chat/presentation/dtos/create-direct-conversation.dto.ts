import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateDirectConversationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  otherUserId: string;
}
