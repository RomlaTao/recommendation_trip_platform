import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../../../../common/decorators/require-permissions.decorator.js';
import type { JwtRequestUser } from '../../../../../common/interfaces/jwt-payload.interface.js';
import { JwtAuthGuard } from '../../../../../core/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../../../../../core/guards/permission.guard.js';
import { ApprovePlaceUseCase } from '../../application/use-cases/approve-place.use-case.js';
import { RejectPlaceUseCase } from '../../application/use-cases/reject-place.use-case.js';
import { DeletePlaceByAdminUseCase } from '../../application/use-cases/delete-place-by-admin.use-case.js';
import { RestorePlaceByAdminUseCase } from '../../application/use-cases/restore-place-by-admin.use-case.js';
import { GetPlaceUseCase } from '../../application/use-cases/get-place.use-case.js';
import { ApprovePlaceDto } from '../dtos/approve-place.dto.js';
import { RejectPlaceDto } from '../dtos/reject-place.dto.js';
import { DeletePlaceDto } from '../dtos/delete-place.dto.js';

@ApiTags('Place Management - Admin')
@ApiBearerAuth()
@Controller('admin/places')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminPlaceController {
  constructor(
    private readonly approvePlaceUseCase: ApprovePlaceUseCase,
    private readonly rejectPlaceUseCase: RejectPlaceUseCase,
    private readonly deletePlaceByAdminUseCase: DeletePlaceByAdminUseCase,
    private readonly restorePlaceByAdminUseCase: RestorePlaceByAdminUseCase,
    private readonly getPlaceUseCase: GetPlaceUseCase,
  ) {}

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places:approve')
  @ApiOperation({ summary: 'Approve a pending place' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async approve(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @Body() _dto: ApprovePlaceDto,
    @CurrentUser() currentUser: JwtRequestUser,
  ): Promise<void> {
    await this.approvePlaceUseCase.execute({
      placeId,
      actor: {
        userId: currentUser.sub,
        permissions: currentUser.permissions,
      },
    });
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places:approve')
  @ApiOperation({ summary: 'Reject a pending place with reason' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async reject(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @Body() dto: RejectPlaceDto,
    @CurrentUser() currentUser: JwtRequestUser,
  ): Promise<void> {
    await this.rejectPlaceUseCase.execute({
      placeId,
      reason: dto.reason,
      actor: {
        userId: currentUser.sub,
        permissions: currentUser.permissions,
      },
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('places:delete')
  @ApiOperation({ summary: 'Soft-delete a place with moderation reason (admin)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async remove(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @Body() dto: DeletePlaceDto,
    @CurrentUser() currentUser: JwtRequestUser,
  ): Promise<void> {
    await this.deletePlaceByAdminUseCase.execute({
      placeId,
      reason: dto.reason,
      actor: {
        userId: currentUser.sub,
        permissions: currentUser.permissions,
      },
    });
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places:delete')
  @ApiOperation({ summary: 'Restore a soft-deleted place (admin)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async restore(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @CurrentUser() currentUser: JwtRequestUser,
  ): Promise<void> {
    await this.restorePlaceByAdminUseCase.execute({
      placeId,
      actor: {
        userId: currentUser.sub,
        permissions: currentUser.permissions,
      },
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places:read')
  @ApiOperation({ summary: 'Get place detail (admin management view)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  getById(@Param('id', new ParseUUIDPipe()) placeId: string) {
    return this.getPlaceUseCase.execute(placeId);
  }
}
