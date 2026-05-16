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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../../../../common/decorators/require-permissions.decorator.js';
import type { JwtRequestUser } from '../../../../../common/interfaces/jwt-payload.interface.js';
import { JwtAuthGuard } from '../../../../../core/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../../../../../core/guards/permission.guard.js';
import { DeletePlaceByAdminUseCase } from '../../application/use-cases/delete-place-by-admin.use-case.js';
import { RestorePlaceByAdminUseCase } from '../../application/use-cases/restore-place-by-admin.use-case.js';
import { GetPlaceUseCase } from '../../application/use-cases/get-place.use-case.js';
import { ListPlacesForAdminUseCase } from '../../application/use-cases/list-places-for-admin.use-case.js';
import { DeletePlaceDto } from '../dtos/delete-place.dto.js';
import { ListPlaceRegistrationRequestsForAdminUseCase } from '../../application/use-cases/list-place-registration-requests-for-admin.use-case.js';
import { ApprovePlaceRegistrationRequestUseCase } from '../../application/use-cases/approve-place-registration-request.use-case.js';
import { RejectPlaceRegistrationRequestUseCase } from '../../application/use-cases/reject-place-registration-request.use-case.js';
import { ListPlaceRegistrationRequestsQueryDto } from '../dtos/list-place-registration-requests.query.dto.js';
import { RejectPlaceRegistrationRequestDto } from '../dtos/reject-place-registration-request.dto.js';
import { AdminListPlacesQueryDto } from '../dtos/admin-list-places.query.dto.js';
import { PlaceRegistrationRequestStatus } from '../../enums/place-registration-request-status.enum.js';

@ApiTags('Place Management - Admin')
@ApiBearerAuth()
@Controller('admin/places')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminPlaceController {
  constructor(
    private readonly deletePlaceByAdminUseCase: DeletePlaceByAdminUseCase,
    private readonly restorePlaceByAdminUseCase: RestorePlaceByAdminUseCase,
    private readonly getPlaceUseCase: GetPlaceUseCase,
    private readonly listPlacesForAdminUseCase: ListPlacesForAdminUseCase,
    private readonly listPlaceRegistrationRequestsForAdminUseCase: ListPlaceRegistrationRequestsForAdminUseCase,
    private readonly approvePlaceRegistrationRequestUseCase: ApprovePlaceRegistrationRequestUseCase,
    private readonly rejectPlaceRegistrationRequestUseCase: RejectPlaceRegistrationRequestUseCase,
  ) {}

  @Get('requests/list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places_admin:read')
  @ApiOperation({ summary: 'List place registration requests for moderation' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listRequests(@Query() query: ListPlaceRegistrationRequestsQueryDto) {
    return this.listPlaceRegistrationRequestsForAdminUseCase.execute(query);
  }

  @Get('requests/pending')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places_admin:read')
  @ApiOperation({ summary: 'List pending place registration requests' })
  listPendingRequests() {
    return this.listPlaceRegistrationRequestsForAdminUseCase.execute({
      status: PlaceRegistrationRequestStatus.PENDING,
      page: 1,
      limit: 100,
    });
  }

  @Patch('requests/:requestId/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places_admin:approve')
  @ApiOperation({ summary: 'Approve a place registration request' })
  @ApiParam({ name: 'requestId', type: String, format: 'uuid' })
  approveRequest(
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @CurrentUser() currentUser: JwtRequestUser,
  ) {
    return this.approvePlaceRegistrationRequestUseCase.execute(
      requestId,
      currentUser.sub,
    );
  }

  @Patch('requests/:requestId/reject')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places_admin:approve')
  @ApiOperation({ summary: 'Reject a place registration request with reason' })
  @ApiParam({ name: 'requestId', type: String, format: 'uuid' })
  rejectRequest(
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @Body() dto: RejectPlaceRegistrationRequestDto,
    @CurrentUser() currentUser: JwtRequestUser,
  ) {
    return this.rejectPlaceRegistrationRequestUseCase.execute(
      requestId,
      currentUser.sub,
      dto.reason,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places_admin:read')
  @ApiOperation({ summary: 'List places for admin moderation' })
  listPlaces(@Query() query: AdminListPlacesQueryDto) {
    return this.listPlacesForAdminUseCase.execute(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places_admin:read')
  @ApiOperation({ summary: 'Get place detail (admin management view)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  getById(@Param('id', new ParseUUIDPipe()) placeId: string) {
    return this.getPlaceUseCase.execute(placeId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('places_admin:delete')
  @ApiOperation({
    summary: 'Soft-delete a place with moderation reason (admin)',
  })
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
  @RequirePermissions('places_admin:delete')
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
}
