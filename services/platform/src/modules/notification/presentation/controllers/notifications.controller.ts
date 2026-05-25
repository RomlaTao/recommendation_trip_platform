import {
  Body,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import type { JwtPayload } from '../../../../common/interfaces/jwt-payload.interface.js';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../../../../core/guards/permission.guard.js';
import { NotificationQueryService } from '../../application/services/notification-query.service.js';
import { NOTIFICATION_PREFERENCE_TYPES } from '../../notification.constants.js';
import type { NotificationPreferenceType } from '../../notification.types.js';
import { ListNotificationsQueryDto } from '../dtos/list-notifications.query.dto.js';
import {
  MarkNotificationReadResponseDto,
  NotificationPreferenceDto,
  PaginatedNotificationsDto,
} from '../dtos/notification-response.dto.js';
import { UpsertNotificationPreferenceDto } from '../dtos/upsert-notification-preference.dto.js';
import { NotificationPresentationMapper } from '../mappers/notification-presentation.mapper.js';

function isNotificationPreferenceType(
  value: string,
): value is NotificationPreferenceType {
  return (Object.values(NOTIFICATION_PREFERENCE_TYPES) as string[]).includes(
    value,
  );
}

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationQueryService: NotificationQueryService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications:read')
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiOkResponse({ type: PaginatedNotificationsDto })
  async listMyNotifications(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<PaginatedNotificationsDto> {
    const result = await this.notificationQueryService.listMyNotifications(
      user.sub,
      {
        page: query.page,
        limit: query.limit,
        isRead: query.isRead,
      },
    );
    return {
      items: result.items.map((item) =>
        NotificationPresentationMapper.toNotificationResponse(item),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications:update')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: MarkNotificationReadResponseDto })
  markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) notificationId: string,
  ): Promise<MarkNotificationReadResponseDto> {
    return this.notificationQueryService.markAsRead(user.sub, notificationId);
  }

  @Get('preferences')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications:read')
  @ApiOperation({ summary: 'List current user notification preferences' })
  @ApiOkResponse({ type: [NotificationPreferenceDto] })
  async listMyPreferences(
    @CurrentUser() user: JwtPayload,
  ): Promise<NotificationPreferenceDto[]> {
    const preferences =
      await this.notificationQueryService.listMyPreferences(user.sub);
    return preferences.map((item) =>
      NotificationPresentationMapper.toPreferenceResponse(item),
    );
  }

  @Put('preferences/:type')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications:update')
  @ApiOperation({
    summary: 'Update current user notification preference by type',
  })
  @ApiParam({
    name: 'type',
    enum: Object.values(NOTIFICATION_PREFERENCE_TYPES),
  })
  @ApiOkResponse({ type: NotificationPreferenceDto })
  async upsertMyPreference(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
    @Body() dto: UpsertNotificationPreferenceDto,
  ): Promise<NotificationPreferenceDto> {
    if (!isNotificationPreferenceType(type)) {
      throw new BadRequestException('notification_preference_type_invalid');
    }
    const saved = await this.notificationQueryService.upsertMyPreference(
      user.sub,
      type,
      {
        emailEnabled: dto.emailEnabled,
        inAppEnabled: dto.inAppEnabled,
      },
    );
    return NotificationPresentationMapper.toPreferenceResponse(saved);
  }
}
