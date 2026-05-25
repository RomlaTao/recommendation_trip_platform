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
  DestinationDto,
  NearbyPlaceDto,
  PaginatedPlacesDto,
  PlaceCategoryDto,
  PlaceDetailDto,
} from '../dtos/place-catalog.response.dto.js';
import { SearchPlacesQueryDto } from '../dtos/search-places.query.dto.js';
import { NearbyRateLimitGuard } from '../guards/nearby-rate-limit.guard.js';
import { PlaceCatalogPresentationMapper } from '../mappers/place-catalog-presentation.mapper.js';

@ApiTags('Place Catalog')
@Controller('places')
export class PlaceCatalogController {
  constructor(private readonly placeCatalogService: PlaceCatalogService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search approved places' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    format: 'uuid',
  })
  @ApiQuery({
    name: 'destinationId',
    required: false,
    type: String,
    format: 'uuid',
  })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['newest', 'rating_desc', 'name_asc'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: PaginatedPlacesDto })
  async search(
    @Query() query: SearchPlacesQueryDto,
  ): Promise<PaginatedPlacesDto> {
    const result = await this.placeCatalogService.search({
      page: query.page,
      limit: query.limit,
      q: query.q,
      categoryId: query.categoryId,
      destinationId: query.destinationId,
      minRating: query.minRating,
      sort: query.sort,
    });
    return {
      items: result.items.map((item) =>
        PlaceCatalogPresentationMapper.toPlaceListItemResponse(item),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @UseGuards(NearbyRateLimitGuard)
  @ApiOperation({ summary: 'Find approved places near a coordinate' })
  @ApiOkResponse({ type: [NearbyPlaceDto] })
  @ApiTooManyRequestsResponse({
    description: 'Too many nearby requests in a short window',
  })
  async findNearby(
    @Query() query: NearbyPlacesQueryDto,
  ): Promise<NearbyPlaceDto[]> {
    const items = await this.placeCatalogService.findNearby({
      lat: query.lat,
      lng: query.lng,
      radiusInMeters: query.radiusInMeters,
      limit: query.limit,
      destinationId: query.destinationId,
    });
    return items.map((item) =>
      PlaceCatalogPresentationMapper.toNearbyPlaceResponse(item),
    );
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List place categories for catalog filters' })
  @ApiOkResponse({ type: [PlaceCategoryDto] })
  async getCategories(): Promise<PlaceCategoryDto[]> {
    const categories = await this.placeCatalogService.listCategories();
    return categories.map((item) =>
      PlaceCatalogPresentationMapper.toCategoryResponse(item),
    );
  }

  @Get('destinations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List destinations for catalog filters' })
  @ApiOkResponse({ type: [DestinationDto] })
  async getDestinations(): Promise<DestinationDto[]> {
    const destinations = await this.placeCatalogService.listDestinations();
    return destinations.map((item) =>
      PlaceCatalogPresentationMapper.toDestinationResponse(item),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get approved place detail by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: PlaceDetailDto })
  async getById(
    @Param('id', new ParseUUIDPipe()) placeId: string,
  ): Promise<PlaceDetailDto> {
    const place = await this.placeCatalogService.getPlaceById(placeId);
    return PlaceCatalogPresentationMapper.toPlaceDetailResponse(place);
  }
}
