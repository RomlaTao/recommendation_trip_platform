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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../../common/decorators/current-user.decorator.js';
import { PaginationDto } from '../../../../../common/dtos/pagination.dto.js';
import type { JwtPayload } from '../../../../../common/interfaces/jwt-payload.interface.js';
import { JwtAuthGuard } from '../../../../../core/guards/jwt-auth.guard.js';
import { PlaceReviewService } from '../../application/services/place-review.service.js';
import { CreateReviewDto } from '../dtos/create-review.dto.js';
import {
  PaginatedPlaceReviewsDto,
  PlaceReviewDto,
} from '../dtos/review-response.dto.js';
import { UpdateReviewDto } from '../dtos/update-review.dto.js';
import { PlaceReviewPresentationMapper } from '../mappers/place-review-presentation.mapper.js';

@ApiTags('Place Reviews')
@Controller()
export class PlaceReviewController {
  constructor(private readonly placeReviewService: PlaceReviewService) {}

  @Get('places/:placeId/reviews')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List place reviews (paginated)' })
  @ApiParam({ name: 'placeId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: PaginatedPlaceReviewsDto })
  async getPlaceReviews(
    @Param('placeId', new ParseUUIDPipe()) placeId: string,
    @Query() query: PaginationDto,
  ): Promise<PaginatedPlaceReviewsDto> {
    const result = await this.placeReviewService.getPlaceReviews(placeId, {
      page: query.page,
      limit: query.limit,
    });
    return {
      items: result.items.map((item) =>
        PlaceReviewPresentationMapper.toPlaceReviewResponse(item),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Post('places/:placeId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Create or update current user review for place (idempotent upsert)',
  })
  @ApiParam({ name: 'placeId', type: String, format: 'uuid' })
  @ApiBody({ type: CreateReviewDto })
  @ApiOkResponse({ type: PlaceReviewDto })
  async upsertReview(
    @Param('placeId', new ParseUUIDPipe()) placeId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ): Promise<PlaceReviewDto> {
    const review = await this.placeReviewService.upsertReview(
      placeId,
      user.sub,
      {
        rating: dto.rating,
        comment: dto.comment,
        imageUrls: dto.imageUrls,
      },
    );
    return PlaceReviewPresentationMapper.toPlaceReviewResponse(review);
  }

  @Patch('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update own review by id' })
  @ApiParam({ name: 'reviewId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateReviewDto })
  @ApiOkResponse({ type: PlaceReviewDto })
  async updateReview(
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateReviewDto,
  ): Promise<PlaceReviewDto> {
    const review = await this.placeReviewService.updateOwnReview(
      reviewId,
      user.sub,
      {
        rating: dto.rating,
        comment: dto.comment,
        imageUrls: dto.imageUrls,
      },
    );
    return PlaceReviewPresentationMapper.toPlaceReviewResponse(review);
  }

  @Delete('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete own review by id' })
  @ApiParam({ name: 'reviewId', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Deleted successfully' })
  async deleteReview(
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.placeReviewService.deleteOwnReview(reviewId, user.sub);
  }
}
