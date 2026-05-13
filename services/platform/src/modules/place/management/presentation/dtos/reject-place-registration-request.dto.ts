import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RejectPlaceRegistrationRequestDto {
  @ApiProperty({ example: 'Missing legal business information' })
  @IsString()
  @Length(3, 1000)
  reason: string;
}
