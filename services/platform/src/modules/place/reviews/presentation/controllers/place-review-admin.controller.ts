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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { RequirePermissions } from '../../../../../common/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../../../core/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../../../../../core/guards/permission.guard.js';
import type { AdminReviewListStatus } from '../../application/queries/list-reviews-for-admin.query.js';
import { PlaceReviewService } from '../../application/services/place-review.service.js';
import {
  AdminReviewListStatusFilter,
  AdminListReviewsQueryDto,
} from '../dtos/admin-list-reviews.query.dto.js';
import { PaginatedAdminReviewsDto } from '../dtos/admin-review-response.dto.js';
import { PlaceReviewPresentationMapper } from '../mappers/place-review-presentation.mapper.js';

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
  @ApiOkResponse({ type: PaginatedAdminReviewsDto })
  async list(
    @Query() query: AdminListReviewsQueryDto,
  ): Promise<PaginatedAdminReviewsDto> {
    const result = await this.placeReviewService.listReviewsForAdmin({
      page: query.page,
      limit: query.limit,
      q: query.q,
      rating: query.rating,
      status: mapAdminReviewStatusFilter(query.status),
    });
    return {
      items: result.items.map((item) =>
        PlaceReviewPresentationMapper.toAdminReviewListItemResponse(item),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
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

function mapAdminReviewStatusFilter(
  status?: AdminReviewListStatusFilter,
): AdminReviewListStatus | undefined {
  if (status === AdminReviewListStatusFilter.DELETED) {
    return 'deleted';
  }
  if (status === AdminReviewListStatusFilter.ACTIVE) {
    return 'active';
  }
  if (status === AdminReviewListStatusFilter.ALL) {
    return 'all';
  }
  return undefined;
}
