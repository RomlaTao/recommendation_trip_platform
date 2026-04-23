import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../../common/decorators/current-user.decorator.js';
import type { JwtRequestUser } from '../../../../../common/interfaces/jwt-payload.interface.js';
import { JwtAuthGuard } from '../../../../../core/guards/jwt-auth.guard.js';
import { CreatePlaceRegistrationRequestUseCase } from '../../application/use-cases/create-place-registration-request.use-case.js';
import { ListMyPlaceRegistrationRequestsUseCase } from '../../application/use-cases/list-my-place-registration-requests.use-case.js';
import { GetMyPlaceRegistrationRequestUseCase } from '../../application/use-cases/get-my-place-registration-request.use-case.js';
import { CreatePlaceRegistrationRequestDto } from '../dtos/create-place-registration-request.dto.js';
import { ListPlaceRegistrationRequestsQueryDto } from '../dtos/list-place-registration-requests.query.dto.js';

@ApiTags('Place Management - User')
@ApiBearerAuth()
@Controller('user/place-requests')
@UseGuards(JwtAuthGuard)
export class UserPlaceController {
  constructor(
    private readonly createPlaceRegistrationRequestUseCase: CreatePlaceRegistrationRequestUseCase,
    private readonly listMyPlaceRegistrationRequestsUseCase: ListMyPlaceRegistrationRequestsUseCase,
    private readonly getMyPlaceRegistrationRequestUseCase: GetMyPlaceRegistrationRequestUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User submits a place profile for moderation' })
  create(
    @CurrentUser() currentUser: JwtRequestUser,
    @Body() dto: CreatePlaceRegistrationRequestDto,
  ): Promise<{ id: string }> {
    return this.createPlaceRegistrationRequestUseCase.execute(currentUser.sub, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List current user place requests' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listMine(
    @CurrentUser() currentUser: JwtRequestUser,
    @Query() query: ListPlaceRegistrationRequestsQueryDto,
  ) {
    return this.listMyPlaceRegistrationRequestsUseCase.execute(currentUser.sub, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get one current user place request' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  getMineById(
    @CurrentUser() currentUser: JwtRequestUser,
    @Param('id', new ParseUUIDPipe()) requestId: string,
  ) {
    return this.getMyPlaceRegistrationRequestUseCase.execute(currentUser.sub, requestId);
  }
}
