import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { PlaceCatalogService } from '../../application/services/place-catalog.service.js';
import { NearbyPlacesQueryDto } from '../dtos/nearby-places.query.dto.js';
import {
  NearbyPlaceDto,
  PaginatedPlacesDto,
  PlaceCategoryDto,
  PlaceDetailDto,
} from '../dtos/place-catalog.response.dto.js';
import { SearchPlacesQueryDto } from '../dtos/search-places.query.dto.js';
import { NearbyRateLimitGuard } from '../guards/nearby-rate-limit.guard.js';

@ApiTags('Place Catalog')
@Controller('places')
export class PlaceCatalogController {
  constructor(private readonly placeCatalogService: PlaceCatalogService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search approved places' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['newest', 'rating_desc', 'name_asc'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: PaginatedPlacesDto })
  search(@Query() query: SearchPlacesQueryDto) {
    return this.placeCatalogService.getPlaces(query);
  }

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @UseGuards(NearbyRateLimitGuard)
  @ApiOperation({ summary: 'Find approved places near a coordinate' })
  @ApiOkResponse({ type: [NearbyPlaceDto] })
  @ApiTooManyRequestsResponse({ description: 'Too many nearby requests in a short window' })
  findNearby(@Query() query: NearbyPlacesQueryDto) {
    return this.placeCatalogService.getNearbyPlaces(query);
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List place categories for catalog filters' })
  @ApiOkResponse({ type: [PlaceCategoryDto] })
  getCategories() {
    return this.placeCatalogService.getCategories();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get approved place detail by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: PlaceDetailDto })
  getById(@Param('id', new ParseUUIDPipe()) placeId: string) {
    return this.placeCatalogService.getPlaceById(placeId);
  }
}
