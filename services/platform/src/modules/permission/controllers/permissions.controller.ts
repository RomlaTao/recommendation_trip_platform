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
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../../../core/guards/permission.guard.js';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator.js';
import { PaginationDto } from '../../../common/dtos/pagination.dto.js';
import { Permission } from '../entities/permission.entity.js';
import { PermissionService } from '../services/permission.service.js';
import { CreatePermissionDto } from '../dto/create-permission.dto.js';

@ApiTags('Permissions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionsController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('permissions:create')
  @ApiOperation({ summary: 'Create permission' })
  @ApiBody({ type: CreatePermissionDto })
  @ApiOkResponse({ description: 'Permission created', type: Permission })
  async createPermission(
    @Body() dto: CreatePermissionDto,
  ): Promise<Permission> {
    return this.permissionService.createPermission(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'List permissions' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse({ description: 'Permissions list loaded' })
  async listPermissions(@Query() query: PaginationDto): Promise<{
    items: Permission[];
    total: number;
    page: number;
    limit: number;
  }> {
    const safePage = Math.max(1, query.page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, query.limit ?? 20));
    const { permissions, total } = await this.permissionService.findMany(
      safePage,
      safeLimit,
    );
    return {
      items: permissions,
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get permission by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Permission detail loaded', type: Permission })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async getPermissionById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Permission> {
    return this.permissionService.assertPermissionExists(id);
  }
}
