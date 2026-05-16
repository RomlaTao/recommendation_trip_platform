import {
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
  ApiTags,
} from '@nestjs/swagger';

import { RequirePermissions } from '../../../../../common/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../../../core/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../../../../../core/guards/permission.guard.js';
import { PlaceReviewService } from '../../application/place-review.service.js';
import { AdminListReviewsQueryDto } from '../dtos/admin-list-reviews.query.dto.js';

@ApiTags('Place Reviews - Admin')
@ApiBearerAuth()
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PlaceReviewAdminController {
  constructor(private readonly placeReviewService: PlaceReviewService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('reviews:read')
  @ApiOperation({ summary: 'List all place reviews for moderation' })
  list(@Query() query: AdminListReviewsQueryDto) {
    return this.placeReviewService.listReviewsForAdmin(query);
  }

  @Delete(':reviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('reviews:delete')
  @ApiOperation({ summary: 'Soft-delete a review (admin)' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  async softDelete(
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
  ): Promise<void> {
    await this.placeReviewService.deleteReviewByAdmin(reviewId);
  }

  @Patch(':reviewId/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('reviews:delete')
  @ApiOperation({ summary: 'Restore a soft-deleted review (admin)' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  async restore(
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
  ): Promise<void> {
    await this.placeReviewService.restoreReviewByAdmin(reviewId);
  }
}
