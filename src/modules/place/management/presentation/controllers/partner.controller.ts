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
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../../common/decorators/require-permissions.decorator.js';
import { CurrentUser } from '../../../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../../../core/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../../../../../core/guards/permission.guard.js';
import type { JwtRequestUser } from '../../../../../common/interfaces/jwt-payload.interface.js';
import { UpdatePlaceDto } from '../dtos/update-place.dto.js';
import { SubmitPlaceDto } from '../dtos/submit-place.dto.js';
import { DeleteOwnPlaceDto } from '../dtos/delete-own-place.dto.js';
import { UpdatePlaceUseCase } from '../../application/use-cases/update-place.use-case.js';
import { SubmitPlaceUseCase } from '../../application/use-cases/submit-place.use-case.js';
import { GetPlaceUseCase } from '../../application/use-cases/get-place.use-case.js';
import { DeleteOwnPlaceUseCase } from '../../application/use-cases/delete-own-place.use-case.js';
import { RestoreOwnPlaceUseCase } from '../../application/use-cases/restore-own-place.use-case.js';

@ApiTags('Place Management - Partner')
@ApiBearerAuth()
@Controller('partner/places')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PartnerPlaceController {
  constructor(
    private readonly updatePlaceUseCase: UpdatePlaceUseCase,
    private readonly submitPlaceUseCase: SubmitPlaceUseCase,
    private readonly getPlaceUseCase: GetPlaceUseCase,
    private readonly deleteOwnPlaceUseCase: DeleteOwnPlaceUseCase,
    private readonly restoreOwnPlaceUseCase: RestoreOwnPlaceUseCase,
  ) {}

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places_partner:update')
  @ApiOperation({ summary: 'Partner updates own draft/rejected place' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async update(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @Body() dto: UpdatePlaceDto,
    @CurrentUser() currentUser: JwtRequestUser,
  ): Promise<void> {
    await this.updatePlaceUseCase.execute({
      placeId,
      ...dto,
      actor: {
        userId: currentUser.sub,
        permissions: currentUser.permissions,
        partnerId: dto.partnerId,
      },
    });
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places_partner:update')
  @ApiOperation({ summary: 'Partner submits place for moderation' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async submit(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @Body() dto: SubmitPlaceDto,
    @CurrentUser() currentUser: JwtRequestUser,
  ): Promise<void> {
    await this.submitPlaceUseCase.execute({
      placeId,
      actor: {
        userId: currentUser.sub,
        permissions: currentUser.permissions,
        partnerId: dto.partnerId,
      },
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places_partner:read')
  @ApiOperation({ summary: 'Get place detail (partner management view)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  getById(@Param('id', new ParseUUIDPipe()) placeId: string) {
    return this.getPlaceUseCase.execute(placeId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('places_partner:delete')
  @ApiOperation({ summary: 'Partner soft-deletes own place' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async remove(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @Body() dto: DeleteOwnPlaceDto,
    @CurrentUser() currentUser: JwtRequestUser,
  ): Promise<void> {
    await this.deleteOwnPlaceUseCase.execute({
      placeId,
      actor: {
        userId: currentUser.sub,
        permissions: currentUser.permissions,
        partnerId: dto.partnerId,
      },
    });
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('places_partner:delete')
  @ApiOperation({ summary: 'Partner restores own soft-deleted place' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async restore(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @Body() dto: DeleteOwnPlaceDto,
    @CurrentUser() currentUser: JwtRequestUser,
  ): Promise<void> {
    await this.restoreOwnPlaceUseCase.execute({
      placeId,
      actor: {
        userId: currentUser.sub,
        permissions: currentUser.permissions,
        partnerId: dto.partnerId,
      },
    });
  }
}
