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
import { PlaceReviewService } from '../../application/place-review.service.js';
import { CreateReviewDto } from '../dtos/create-review.dto.js';
import {
  PaginatedPlaceReviewsDto,
  PlaceReviewDto,
} from '../dtos/review-response.dto.js';
import { UpdateReviewDto } from '../dtos/update-review.dto.js';

@ApiTags('Place Reviews')
@Controller()
export class PlaceReviewController {
  constructor(private readonly placeReviewService: PlaceReviewService) {}

  @Get('places/:placeId/reviews')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List place reviews (paginated)' })
  @ApiParam({ name: 'placeId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: PaginatedPlaceReviewsDto })
  getPlaceReviews(
    @Param('placeId', new ParseUUIDPipe()) placeId: string,
    @Query() query: PaginationDto,
  ) {
    return this.placeReviewService.getPlaceReviews(
      placeId,
      query.page,
      query.limit,
    );
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
  upsertReview(
    @Param('placeId', new ParseUUIDPipe()) placeId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.placeReviewService.upsertReview(placeId, user.sub, dto);
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
  updateReview(
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.placeReviewService.updateOwnReview(reviewId, user.sub, dto);
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
