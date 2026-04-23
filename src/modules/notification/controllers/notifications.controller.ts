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
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator.js';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface.js';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../../../core/guards/permission.guard.js';
import { ListNotificationsQueryDto } from '../dto/list-notifications.query.dto.js';
import { UpsertNotificationPreferenceDto } from '../dto/upsert-notification-preference.dto.js';
import { NotificationService } from '../services/notification.service.js';
import { NOTIFICATION_PREFERENCE_TYPES } from '../notification.constants.js';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications:read')
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Notifications loaded' })
  listMyNotifications(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationService.listMyNotifications(user.sub, query);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications:update')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Notification marked as read' })
  markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) notificationId: string,
  ) {
    return this.notificationService.markAsRead(user.sub, notificationId);
  }

  @Get('preferences')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications:read')
  @ApiOperation({ summary: 'List current user notification preferences' })
  @ApiOkResponse({ description: 'Notification preferences loaded' })
  listMyPreferences(@CurrentUser() user: JwtPayload) {
    return this.notificationService.listMyPreferences(user.sub);
  }

  @Put('preferences/:type')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications:update')
  @ApiOperation({ summary: 'Update current user notification preference by type' })
  @ApiParam({
    name: 'type',
    enum: Object.values(NOTIFICATION_PREFERENCE_TYPES),
  })
  @ApiOkResponse({ description: 'Notification preference updated' })
  upsertMyPreference(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
    @Body() dto: UpsertNotificationPreferenceDto,
  ) {
    if (!Object.values(NOTIFICATION_PREFERENCE_TYPES).includes(type as any)) {
      throw new BadRequestException('notification_preference_type_invalid');
    }
    return this.notificationService.upsertMyPreference(user.sub, type as any, dto);
  }
}
