import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  sourceEventId: string;

  @ApiProperty({ format: 'uuid' })
  recipientUserId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional({ nullable: true })
  data?: unknown;

  @ApiProperty()
  isRead: boolean;

  @ApiPropertyOptional({ nullable: true })
  readAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedNotificationsDto {
  @ApiProperty({ type: [NotificationDto] })
  items: NotificationDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class NotificationPreferenceDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  emailEnabled: boolean;

  @ApiProperty()
  inAppEnabled: boolean;
}

export class MarkNotificationReadResponseDto {
  @ApiProperty({ example: true })
  success: true;
}
